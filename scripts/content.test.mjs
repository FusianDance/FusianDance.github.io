import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { addEntry, berlinIso, mergeSheet, postUrl, sheetEntries } from "./content.mjs";

test("berlinIso", () => {
  assert.equal(berlinIso("2025-07-01 19:00"), "2025-07-01T19:00:00+02:00");
  assert.equal(berlinIso("2025-12-01 19:00:30"), "2025-12-01T19:00:30+01:00");
  assert.equal(berlinIso("2025-12-01"), "2025-12-01T00:00:00+01:00");
  assert.equal(berlinIso("2025-12-01T19:00:00+01:00"), "2025-12-01T19:00:00+01:00");
  assert.equal(berlinIso("01.12.2025 19:00"), null);
  assert.equal(berlinIso(""), null);
});

test("postUrl only lets canonical urls through", () => {
  assert.equal(postUrl("https://www.instagram.com/p/AbC_1-x/?utm_source=ig"), "https://www.instagram.com/p/AbC_1-x/");
  assert.equal(postUrl(" https://www.instagram.com/reel/XyZ "), "https://www.instagram.com/reel/XyZ/");
  assert.equal(postUrl('https://www.instagram.com/p/x"><script>/'), null);
  assert.equal(postUrl("https://evil.com/p/abc/"), null);
  assert.equal(postUrl("javascript:alert(1)"), null);
});

const csv = `timestamp,type,title,content,date,post_url
2025-10-01 12:00:00,Announcement,Show,"Line 1, with comma
Line 2",2025-11-05 19:00,
2025-10-02 12:00:00,Announcement,No date,Uses timestamp,,
2025-10-03 12:00:00,Announcement,,missing title,,
2025-10-04 12:00:00,Instagram post,,,,https://www.instagram.com/p/AAA/
2025-10-05 12:00:00,Instagram post,,,,<img src=x onerror=alert(1)>
2025-10-06 12:00:00,Instagram post,,,,https://www.instagram.com/reel/BBB/?igsh=1
`;

test("sheetEntries parses, validates and tags rows", () => {
  const { announcements, posts } = sheetEntries(csv);
  assert.deepEqual(announcements, [
    {
      title: "Show",
      content: "Line 1, with comma\nLine 2",
      date: "2025-11-05T19:00:00+01:00",
      source: "sheet",
      sourceId: "2025-10-01 12:00:00",
    },
    {
      title: "No date",
      content: "Uses timestamp",
      date: "2025-10-02T12:00:00+02:00",
      source: "sheet",
      sourceId: "2025-10-02 12:00:00",
    },
  ]);
  assert.deepEqual(
    posts.map((p) => p.url),
    ["https://www.instagram.com/p/AAA/", "https://www.instagram.com/reel/BBB/"],
  );
  assert.throws(() => sheetEntries("<html>Sign in</html>"), /missing column/);
});

test("mergeSheet replaces sheet entries and keeps manual ones and comments", () => {
  const file = `# header comment
- title: Manual
  content: kept
  date: 2025-01-01T10:00:00+01:00
- title: Old sheet row
  content: removed
  date: 2025-01-02T10:00:00+01:00
  source: sheet
  sourceId: x
`;
  const { announcements, posts } = sheetEntries(csv);
  const merged = mergeSheet(file, announcements);
  assert.match(merged, /^# header comment/);
  assert.deepEqual(
    parse(merged).map((a) => a.title),
    ["Manual", "Show", "No date"],
  );
  assert.equal(mergeSheet(merged, announcements), merged, "re-running with the same sheet changes nothing");

  const postFile = "- url: https://www.instagram.com/p/MANUAL/\n";
  const mergedPosts = parse(mergeSheet(postFile, posts, { prepend: true })).map((p) => p.url);
  assert.deepEqual(mergedPosts, [
    "https://www.instagram.com/reel/BBB/",
    "https://www.instagram.com/p/AAA/",
    "https://www.instagram.com/p/MANUAL/",
  ]);
});

test("real data files round-trip unchanged and addEntry appends", () => {
  for (const file of ["data/announcements.yml", "data/insta-posts.yml"]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(mergeSheet(text, []), text, `${file} must not be reformatted by a no-op sync`);
  }
  assert.deepEqual(parse(addEntry("# only a comment\n", { url: "u" })), [{ url: "u" }]);
});
