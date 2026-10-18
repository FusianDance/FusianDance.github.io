// Browser mode: starts from the working tree and saves into localStorage only, so no file ever changes.
// The saved copy is dropped once the files it started from change (git checkout, pull, hand edit).
import { KEYS, type ContentStore, type Saved } from "./files";
import { localStore } from "./local-store";

const KEY = "fusian-edit-browser";

export const browserStore: ContentStore = {
  async load() {
    const files = await localStore.load();
    let kept: Saved | null = null;
    try {
      kept = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      // unreadable: start from the files
    }
    return kept && KEYS.every((key) => kept.shas[key] === files.shas[key]) ? kept : files;
  },
  async save(draft, saved) {
    // shas stay those of the files on disk, so load() still notices when they change
    const next = { content: draft, shas: saved.shas };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      throw new Error("Not enough browser storage (photos are big). Remove some photos and save again.");
    }
    return { saved: next };
  },
};
