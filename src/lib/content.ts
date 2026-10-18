// Content model shared by the build (data.server.ts) and the edit mode (edit.ts).
// Only relative imports: scripts/content.test.mjs runs this file with plain node.
import { parseDocument, type Document } from "yaml";
import type { Announcement } from "./models/announcement";
import type { InstaPost } from "./models/insta-post";

/** Entries as stored in data/announcements.yml and data/insta-posts.yml. */
export type AnnouncementEntry = {
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
};
export type PostEntry = { url: string };

/** "YYYY-MM-DD[ |T]HH:MM[:SS]" in Munich time, or ISO with offset → ISO with offset. null if invalid. */
export function berlinIso(text: string): string | null {
  const s = String(text ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/.test(s)) return isNaN(Date.parse(s)) ? null : s;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const local = `${m[1]}T${m[2] ?? "00"}:${m[3] ?? "00"}:${m[4] ?? "00"}`;
  const asUtc = new Date(`${local}Z`);
  if (isNaN(asUtc.getTime())) return null;
  // ponytail: offset looked up at the wall-clock time read as UTC, so it's an hour off within ~2h of a DST switch (at night).
  const offset = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" })
    .formatToParts(asUtc)
    .find((p) => p.type === "timeZoneName")!.value; // "GMT+02:00", or "GMT" for +0
  return local + (offset.slice(3) || "+00:00");
}

/** ISO date → "YYYY-MM-DDTHH:MM" Munich time, the value format of <input type="datetime-local">. */
export function berlinLocal(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).slice(0, 16).replace(" ", "T");
}

/** Canonical https://www.instagram.com/(p|reel)/<id>/ or null. Never pass user text into embed HTML. */
export function postUrl(text: string): string | null {
  const m = String(text ?? "")
    .trim()
    .match(/^https:\/\/www\.instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)(\/|\?|$)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null;
}

/** Midnight (Munich) after the day of this ISO date. */
function nextBerlinDay(iso: string) {
  const day = new Date(`${berlinLocal(iso).slice(0, 10)}T00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return new Date(berlinIso(day.toISOString().slice(0, 10))!);
}

/** Sorted by when they're over, newest first. Throws on an invalid date or an end before the start. */
export function toAnnouncements(entries: AnnouncementEntry[]): Announcement[] {
  return entries
    .map((entry, i) => {
      const start = new Date(entry.startDate);
      if (isNaN(start.getTime())) throw new Error(`data/announcements.yml: invalid startDate "${entry.startDate}"`);
      const end = entry.endDate == null ? undefined : new Date(entry.endDate);
      if (end && isNaN(end.getTime())) throw new Error(`data/announcements.yml: invalid endDate "${entry.endDate}"`);
      if (end && end < start) throw new Error(`data/announcements.yml: "${entry.title}" ends before it starts`);
      const allDay = entry.allDay === true;
      const last = entry.endDate ?? entry.startDate;
      const pastAt = allDay ? nextBerlinDay(last).getTime() : new Date(last).getTime();
      return { id: String(i), title: entry.title, content: entry.content, start, end, allDay, pastAt };
    })
    .sort((a, b) => b.pastAt - a.pastAt);
}

/** PostCard puts the URL into embed HTML, so only canonical post URLs get through. */
export function toPosts(entries: PostEntry[]): InstaPost[] {
  return entries.map((entry, i) => {
    if (postUrl(entry.url) !== entry.url) throw new Error(`data/insta-posts.yml: invalid post url "${entry.url}"`);
    return { id: String(i), url: entry.url };
  });
}

/** Keys of the enabled flagged pages: FEATURES ("audition,other", "" = none) if set, else data/pages.yml.
 * known: the keys of FlaggedPages. */
export function toPages(entries: Record<string, boolean>, known: string[], features?: string): string[] {
  for (const [key, on] of Object.entries(entries)) {
    if (typeof on !== "boolean") throw new Error(`data/pages.yml: "${key}" must be true or false`);
  }
  const keys =
    features == null
      ? Object.keys(entries).filter((key) => entries[key])
      : features
          .split(",")
          .map((key) => key.trim())
          .filter(Boolean);
  const unknown = [...Object.keys(entries), ...keys].find((key) => !known.includes(key));
  if (unknown) throw new Error(`data/pages.yml or FEATURES: unknown page "${unknown}" (see FlaggedPages)`);
  return keys;
}

/** Replace the content of a YAML data file, keeping its header comment. */
export function toYaml(text: string, entries: unknown) {
  const doc: Document = parseDocument(text);
  doc.contents = doc.createNode(entries);
  return doc.toString({ lineWidth: 0 });
}

/** The sha git (and the GitHub API) gives a file with this content. */
export async function gitBlobSha(text: string) {
  const bytes = new TextEncoder().encode(text);
  const blob = new Uint8Array([...new TextEncoder().encode(`blob ${bytes.length}\0`), ...bytes]);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", blob));
  return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
}
