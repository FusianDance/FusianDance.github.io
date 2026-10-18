// Edit mode's core, and the only module of src/lib/edit the UI imports (besides the mode texts in target.ts).
// Behind it: the stores (ContentStore in files.ts: GitHub, local files, browser), the login (auth.ts) and the
// deploy status (deploy.ts). TARGET is fixed at build time, so the bundle only keeps the store it uses.
// The content is edited in memory and Save hands it to the store: one commit on main (which triggers
// deploy.yml) or a branch, the working tree (local) or localStorage (browser). Typing only touches memory;
// unsaved edits are backed up to localStorage when the page is left or hidden, so they survive reloads, the
// login trip to Google and closing the tab.
import { useMemo, useSyncExternalStore } from "react";
import { toAnnouncements, toPosts } from "@/lib/content";
import type { Announcement } from "@/lib/models/announcement";
import type { Contact } from "@/lib/models/contact";
import type { InstaPost } from "@/lib/models/insta-post";
import { clearLogin } from "./auth";
import { browserStore } from "./browser-store";
import { sameFiles, type ContentStore, type Draft, type Saved } from "./files";
import { githubStore } from "./github-store";
import { localStore } from "./local-store";
import { readJson, writeJson } from "./storage";
import { TARGET } from "./target";

export type { Draft } from "./files";
export { problem } from "./files";
export { finishLogin, login, useLoggedIn } from "./auth";
export { DEPLOY_DETAILS_URL, DEPLOY_TEXT, useDeploy } from "./deploy";

const store: ContentStore = TARGET === "browser" ? browserStore : TARGET === "local" ? localStore : githubStore;

/** draft = being edited, saved = as last saved (Discard goes back to it), preview = show the pages with the
 * draft instead of the editors. */
export type Session = { draft: Draft; saved: Saved; preview: boolean };

let session: Session | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Session | null) {
  session = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const useSession = () =>
  useSyncExternalStore(
    subscribe,
    () => session,
    () => null, // prerendered HTML: not editing
  );
export const useDraft = () => useSession()?.draft ?? null;
/** The draft while the pages show their editors (logged in, not previewing), else null. */
export function useEditDraft() {
  const session = useSession();
  return session && !session.preview ? session.draft : null;
}

export const isDirty = (s: Session) => JSON.stringify(s.draft) !== JSON.stringify(s.saved.content);

export function updateDraft(fn: (draft: Draft) => Draft) {
  if (session) set({ ...session, draft: fn(session.draft) });
}

export function setPreview(preview: boolean) {
  if (session) set({ ...session, preview });
}

export function discard() {
  if (session) set({ ...session, draft: session.saved.content });
  dropBackup();
}

/** Loads the saved content from the store, and the unsaved edits on top if they are based on it. Once per page
 * load, after login. */
export function startSession() {
  loading ??= store.load().then(
    (saved) => {
      const kept = readBackup();
      if (kept && sameFiles(kept.saved, saved)) {
        set({ draft: kept.draft, saved: kept.saved, preview: false });
      } else {
        if (kept) dropBackup(); // made on content that changed since (or in another mode)
        set({ draft: saved.content, saved, preview: false });
      }
    },
    (e) => {
      loading = null;
      throw e;
    },
  );
  return loading;
}

/** Saves the draft. commit: the GitHub commit, if any; pagesChanged: pages were switched on or off, which only
 * takes effect with the next build. Edits typed while saving stay in the draft. */
export async function save() {
  const { draft, saved } = session!;
  const pagesChanged = JSON.stringify(draft.pages) !== JSON.stringify(saved.content.pages);
  const result = await store.save(draft, saved);
  if (session) set({ ...session, saved: result.saved });
  dropBackup();
  return { commit: result.commit ?? null, pagesChanged };
}

type PageContent = {
  announcements?: Announcement[];
  posts?: InstaPost[];
  about?: string;
  audition?: string;
  contact?: Contact;
};

/** The page's build-time content, or the draft's while a session is open (so Preview shows unsaved edits).
 * uploads: the unsaved photos the draft's Markdown points to. */
export function useLiveContent<T extends PageContent>(data: T): T & { uploads?: Record<string, string> } {
  const draft = useDraft();
  return useMemo(() => {
    if (!draft) return data;
    const live: PageContent & { uploads?: Record<string, string> } = { uploads: draft.uploads };
    if (data.announcements) live.announcements = toAnnouncements(draft.announcements);
    if (data.posts) live.posts = toPosts(draft.posts);
    if (data.about != null) live.about = draft.about;
    if (data.audition != null) live.audition = draft.audition;
    if (data.contact) live.contact = draft.contact;
    return { ...data, ...live };
  }, [data, draft]);
}

// ---- unsaved edits across reloads, logins and closed tabs

const BACKUP_KEY = "fusian-edit-draft";
/** The unsaved edits and the saved state they are based on, from the last time the page was left. */
type Backup = { target: string; draft: Draft; saved: Saved };

function readBackup() {
  const kept = readJson<Backup>(BACKUP_KEY);
  return kept?.target === TARGET ? kept : null;
}

const dropBackup = () => writeJson(BACKUP_KEY, null);

/** false if the unsaved edits didn't fit into localStorage (many big photos). Only Save, Discard and Log out
 * remove the backup, so a tab without edits never deletes another tab's. */
function backup() {
  if (!session || !isDirty(session)) return true;
  return writeJson(BACKUP_KEY, { target: TARGET, draft: session.draft, saved: session.saved } satisfies Backup);
}

if (typeof window !== "undefined") {
  // ponytail: two tabs with unsaved edits share the one backup, the last one left wins.
  window.addEventListener("beforeunload", (event) => {
    if (!backup()) event.preventDefault(); // didn't fit: the browser asks "Leave site?"
  });
  window.addEventListener("pagehide", backup);
  document.addEventListener("visibilitychange", () => document.hidden && backup()); // phones skip pagehide
  writeJson("fusian-edit-session", null); // drafts of the old localStorage-based edit mode
}

/** Ends edit mode: drops the session, unsaved edits and the login. */
export function logout() {
  loading = null;
  set(null);
  dropBackup();
  clearLogin();
}
