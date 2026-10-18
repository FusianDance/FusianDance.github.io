// The edited content, the data files it lives in, and the interface every store (GitHub, local files, browser)
// implements. session.ts picks the store for TARGET.
import { parse } from "yaml";
import { gitBlobSha, toYaml, type AnnouncementEntry, type PostEntry } from "@/lib/content";
import type { Contact } from "@/lib/models/contact";

export const FILES = {
  announcements: "data/announcements.yml",
  posts: "data/insta-posts.yml",
  about: "data/about.md",
  audition: "data/audition.md",
  contact: "data/contact.yml",
  pages: "data/pages.yml",
} as const;
export type FileKey = keyof typeof FILES;
export const KEYS = Object.keys(FILES) as FileKey[];
const isMarkdown = (key: FileKey): key is "about" | "audition" => FILES[key].endsWith(".md");

export type Draft = {
  announcements: AnnouncementEntry[];
  posts: PostEntry[];
  about: string;
  audition: string;
  contact: Contact;
  /** Flagged page key → enabled (data/pages.yml). Takes effect with the deploy after Save. */
  pages: Record<string, boolean>;
  /** Photos pasted into a Markdown page and not yet in the repo: "/uploads/<name>.jpg" → data URL. */
  uploads: Record<string, string>;
};

/** The content as last saved, and the blob shas of the files it came from (to refuse saving over a change
 * made elsewhere in the meantime). */
export type Saved = { content: Draft; shas: Record<FileKey, string> };

export type ContentStore = {
  load(): Promise<Saved>;
  /** Saves the draft over `saved` and returns the new saved state, plus the commit when there is one.
   * Throws if a file changed since `saved` was loaded. */
  save(draft: Draft, saved: Saved): Promise<{ saved: Saved; commit?: string }>;
};

type File = { text: string; sha: string };

export async function loadFiles(read: (key: FileKey) => Promise<File>): Promise<Saved> {
  const files = await Promise.all(KEYS.map(read));
  const content = Object.fromEntries(
    KEYS.map((key, i) => [key, isMarkdown(key) ? files[i].text : (parse(files[i].text) ?? [])]),
  ) as Omit<Draft, "uploads">;
  const shas = Object.fromEntries(KEYS.map((key, i) => [key, files[i].sha])) as Saved["shas"];
  return { content: { ...content, uploads: {} }, shas };
}

function serialize(key: FileKey, draft: Draft, fileText: string) {
  if (isMarkdown(key)) return draft[key].endsWith("\n") ? draft[key] : draft[key] + "\n";
  if (key === "announcements") {
    return toYaml(
      fileText,
      [...draft.announcements]
        .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
        .map(({ title, content, startDate, endDate, allDay }) => ({ title, content, startDate, endDate, allDay })),
    );
  }
  return toYaml(fileText, draft[key]);
}

/** What saving the draft writes: the new text of every changed file (read via `read`, refusing if it changed
 * since loading) and the photos the Markdown pages use that aren't saved yet. */
export async function changes(draft: Draft, saved: Saved, read: (key: FileKey) => Promise<File>) {
  const files: { key: FileKey; path: string; text: string }[] = [];
  for (const key of KEYS) {
    if (JSON.stringify(draft[key]) === JSON.stringify(saved.content[key])) continue;
    const file = await read(key);
    if (file.sha !== saved.shas[key]) {
      throw new Error(
        `${FILES[key]} was changed elsewhere since you started editing. Discard your changes and redo them.`,
      );
    }
    files.push({ key, path: FILES[key], text: serialize(key, draft, file.text) });
  }
  // Photos deleted from the text again are dropped.
  const photos = Object.entries(draft.uploads).filter(
    ([path]) => !(path in saved.content.uploads) && [draft.about, draft.audition].some((text) => text.includes(path)),
  );
  return { files, photos };
}

/** The saved state once `files` are written. Saved photos stay in uploads, so the preview shows them until
 * the deploy is live. */
export async function savedAfter(draft: Draft, saved: Saved, files: { key: FileKey; text: string }[]) {
  const shas = { ...saved.shas };
  for (const { key, text } of files) shas[key] = await gitBlobSha(text);
  return { content: draft, shas };
}

/** What blocks saving, or null. */
export function problem({ announcements, contact }: Draft) {
  const bad = announcements.find((a) => !a.title.trim() || !a.content.trim());
  if (bad) return `Every event needs a title and a text${bad.title.trim() ? ` ("${bad.title}")` : ""}.`;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) return "Contact: the email address looks wrong.";
  if (!contact.instagram.startsWith("https://www.instagram.com/")) {
    return "Contact: the Instagram link must start with https://www.instagram.com/";
  }
  if (contact.trainingHours.some((t) => !t.day || !t.start || !t.end || !t.location.trim())) {
    return "Contact: every training needs a day, start, end and location.";
  }
  return null;
}
