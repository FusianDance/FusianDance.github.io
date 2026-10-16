import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { execFileSync } from "node:child_process";
import { berlinIso, berlinLocal, gitBlobSha, postUrl, toAnnouncements, toPosts, toYaml } from "../src/lib/content.ts";

test("berlinIso", () => {
  assert.equal(berlinIso("2025-07-01 19:00"), "2025-07-01T19:00:00+02:00");
  assert.equal(berlinIso("2025-07-01T19:00"), "2025-07-01T19:00:00+02:00");
  assert.equal(berlinIso("2025-12-01 19:00:30"), "2025-12-01T19:00:30+01:00");
  assert.equal(berlinIso("2025-12-01"), "2025-12-01T00:00:00+01:00");
  assert.equal(berlinIso("2025-12-01T19:00:00+01:00"), "2025-12-01T19:00:00+01:00");
  assert.equal(berlinIso("01.12.2025 19:00"), null);
  assert.equal(berlinIso(""), null);
});

test("berlinLocal is the inverse of berlinIso", () => {
  assert.equal(berlinLocal("2025-07-01T19:00:00+02:00"), "2025-07-01T19:00");
  assert.equal(berlinLocal("2025-12-01T18:00:00Z"), "2025-12-01T19:00");
  assert.equal(berlinIso(berlinLocal("2026-01-31T20:00:00+01:00")), "2026-01-31T20:00:00+01:00");
});

test("postUrl only lets canonical urls through", () => {
  assert.equal(postUrl("https://www.instagram.com/p/AbC_1-x/?utm_source=ig"), "https://www.instagram.com/p/AbC_1-x/");
  assert.equal(postUrl(" https://www.instagram.com/reel/XyZ "), "https://www.instagram.com/reel/XyZ/");
  assert.equal(postUrl('https://www.instagram.com/p/x"><script>/'), null);
  assert.equal(postUrl("https://evil.com/p/abc/"), null);
  assert.equal(postUrl("javascript:alert(1)"), null);
});

test("toAnnouncements / toPosts validate", () => {
  const entries = [
    { title: "Old", content: "", date: "2025-01-01T10:00:00+01:00" },
    { title: "New", content: "", date: "2025-02-01T10:00:00+01:00" },
  ];
  assert.deepEqual(
    toAnnouncements(entries).map((a) => a.title),
    ["New", "Old"],
  );
  assert.throws(() => toAnnouncements([{ title: "x", content: "", date: "soon" }]), /invalid date/);
  assert.throws(() => toPosts([{ url: "https://www.instagram.com/p/x/?a=1" }]), /invalid post url/);
});

test("toYaml keeps the header comment and round-trips the real data files", () => {
  for (const file of ["data/announcements.yml", "data/insta-posts.yml", "data/contact.yml"]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(toYaml(text, parse(text)), text, `${file} must not be reformatted by a no-op save`);
  }
  const out = toYaml("# header\n\n- url: a\n", [{ url: "b" }, { url: "c" }]);
  assert.match(out, /^# header\n/);
  assert.deepEqual(parse(out), [{ url: "b" }, { url: "c" }]);
  assert.deepEqual(parse(toYaml("# only a comment\n", [{ url: "u" }])), [{ url: "u" }]);
});

test("gitBlobSha matches git hash-object", async () => {
  const file = "data/announcements.yml";
  const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.equal(await gitBlobSha(text), execFileSync("git", ["hash-object", file], { encoding: "utf8" }).trim());
});
