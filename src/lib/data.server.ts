// Build-time content from data/*. Server components only (uses fs);
// pass the results to client components as props.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { toAnnouncements, toPages, toPosts, type AnnouncementEntry, type PostEntry } from "./content";
import type { Contact } from "./models/contact";
import { FlaggedPages } from "./models/nav-item";

function load<T>(name: string): T {
  return parse(readFileSync(join(process.cwd(), "data", `${name}.yml`), "utf8")) ?? [];
}

export const contact = load<Contact>("contact");
export const announcements = toAnnouncements(load<AnnouncementEntry[]>("announcements"));
export const posts = toPosts(load<PostEntry[]>("insta-posts"));
/** Keys of the enabled flagged pages, also read by src/routes.ts. */
export const pages = toPages(
  load<Record<string, boolean>>("pages"),
  FlaggedPages.map((page) => page.key),
  process.env.FEATURES,
);
export const about = readFileSync(join(process.cwd(), "data", "about.md"), "utf8");
export const privacy = readFileSync(join(process.cwd(), "data", "privacy.md"), "utf8");
