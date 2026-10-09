// Build-time content from data/*.yml. Server components only (uses fs);
// pass the results to client components as props.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Announcement } from "./models/announcement";
import type { Contact } from "./models/contact";
import type { InstaPost } from "./models/insta-post";

function load<T>(name: string): T {
  return parse(readFileSync(join(process.cwd(), "data", `${name}.yml`), "utf8")) ?? [];
}

export const contact = load<Contact>("contact");

// Sorted newest first.
export const announcements: Announcement[] = load<{ title: string; content: string; date: string }[]>("announcements")
  .map((entry, i) => {
    const timestamp = new Date(entry.date);
    if (isNaN(timestamp.getTime())) throw new Error(`data/announcements.yml: invalid date "${entry.date}"`);
    return { id: String(i), title: entry.title, content: entry.content, timestamp };
  })
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

// PostCard puts the URL into embed HTML, so only canonical post URLs get through.
export const posts: InstaPost[] = load<{ url: string }[]>("insta-posts").map((entry, i) => {
  if (!/^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/$/.test(entry.url)) {
    throw new Error(`data/insta-posts.yml: invalid post url "${entry.url}"`);
  }
  return { id: String(i), url: entry.url };
});
