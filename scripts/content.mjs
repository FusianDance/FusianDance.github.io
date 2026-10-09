// Writes data/announcements.yml and data/insta-posts.yml.
//   node scripts/content.mjs sync                                   (env SHEET_CSV_URL, see sheet-sync.yml)
//   node scripts/content.mjs add-announcement <title> <content> [date]
//   node scripts/content.mjs add-post <url>
// Self-check: node --test "scripts/*.test.mjs"
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { parseDocument } from "yaml";

const ANNOUNCEMENTS = "data/announcements.yml";
const POSTS = "data/insta-posts.yml";

/** "YYYY-MM-DD[ HH:MM[:SS]]" in Munich time, or ISO with offset → ISO with offset. null if invalid. */
export function berlinIso(text) {
  const s = String(text ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/.test(s)) return isNaN(new Date(s)) ? null : s;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const local = `${m[1]}T${m[2] ?? "00"}:${m[3] ?? "00"}:${m[4] ?? "00"}`;
  const asUtc = new Date(`${local}Z`);
  if (isNaN(asUtc)) return null;
  // ponytail: offset looked up at the wall-clock time read as UTC, so it's an hour off within ~2h of a DST switch (at night).
  const offset = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" })
    .formatToParts(asUtc)
    .find((p) => p.type === "timeZoneName").value; // "GMT+02:00", or "GMT" for +0
  return local + (offset.slice(3) || "+00:00");
}

/** Canonical https://www.instagram.com/(p|reel)/<id>/ or null. Never pass user text into embed HTML. */
export function postUrl(text) {
  const m = String(text ?? "")
    .trim()
    .match(/^https:\/\/www\.instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)(\/|\?|$)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null;
}

/** Published sheet CSV → entries tagged source: sheet. Invalid rows are skipped with a warning. */
export function sheetEntries(csv) {
  const { data, meta } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  // Guard: an error/login page instead of the CSV would otherwise wipe all sheet entries.
  const cols = ["timestamp", "type", "title", "content", "date", "post_url"];
  for (const col of cols) {
    if (!meta.fields?.includes(col)) throw new Error(`sheet CSV is missing column "${col}"`);
  }
  const announcements = [];
  const posts = [];
  for (const raw of data) {
    const row = Object.fromEntries(cols.map((col) => [col, (raw[col] ?? "").trim()]));
    const { timestamp: sourceId, type, title, content } = row;
    if (type === "Announcement") {
      const date = berlinIso(row.date || row.timestamp);
      if (!title || !content || !date)
        console.warn(`skipping announcement row ${sourceId}: missing title/content or bad date`);
      else announcements.push({ title, content, date, source: "sheet", sourceId });
    } else if (type === "Instagram post") {
      const url = postUrl(row.post_url);
      if (!url) console.warn(`skipping post row ${sourceId}: bad url`);
      else posts.push({ url, source: "sheet", sourceId });
    } else {
      console.warn(`skipping row ${sourceId}: unknown type "${type}"`);
    }
  }
  return { announcements, posts };
}

function edit(yamlText, fn) {
  const doc = parseDocument(yamlText);
  if (!doc.contents) doc.contents = doc.createNode([]);
  fn(doc.contents.items, (entry) => doc.createNode(entry));
  return doc.toString({ lineWidth: 0 });
}

/** Replace all `source: sheet` entries, keep everything else (and its comments) as is. */
export function mergeSheet(yamlText, entries, { prepend = false } = {}) {
  return edit(yamlText, (items, node) => {
    const manual = items.filter((item) => item.get?.("source") !== "sheet");
    const sheet = entries.map(node);
    // ponytail: posts list newest first, so sheet posts sit above all manual ones; add a date field if order ever matters.
    items.splice(0, items.length, ...(prepend ? [...sheet.reverse(), ...manual] : [...manual, ...sheet]));
  });
}

export function addEntry(yamlText, entry, { prepend = false } = {}) {
  return edit(yamlText, (items, node) => (prepend ? items.unshift(node(entry)) : items.push(node(entry))));
}

const update = (file, fn) => writeFileSync(file, fn(readFileSync(file, "utf8")));

async function main([cmd, ...args]) {
  if (cmd === "sync") {
    const url = process.env.SHEET_CSV_URL;
    if (!url) throw new Error("SHEET_CSV_URL is not set");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetching sheet CSV failed: ${res.status} ${res.statusText}`);
    const { announcements, posts } = sheetEntries(await res.text());
    update(ANNOUNCEMENTS, (t) => mergeSheet(t, announcements));
    update(POSTS, (t) => mergeSheet(t, posts, { prepend: true }));
    console.log(`sheet: ${announcements.length} announcements, ${posts.length} posts`);
  } else if (cmd === "add-announcement") {
    const [title, content, dateText] = args.map((a) => a?.trim());
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }); // "YYYY-MM-DD HH:MM:SS"
    const date = berlinIso(dateText || now);
    if (!title || !content || !date) throw new Error("need a title, content and a valid date (YYYY-MM-DD HH:MM)");
    update(ANNOUNCEMENTS, (t) => addEntry(t, { title, content, date }));
  } else if (cmd === "add-post") {
    const url = postUrl(args[0]);
    if (!url) throw new Error(`not an Instagram post url: ${args[0]}`);
    update(POSTS, (t) => addEntry(t, { url }, { prepend: true }));
  } else {
    throw new Error("usage: content.mjs sync | add-announcement <title> <content> [date] | add-post <url>");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
