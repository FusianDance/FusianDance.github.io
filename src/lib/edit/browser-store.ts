// Browser mode: starts from the working tree and saves into localStorage only, so no file ever changes.
// The saved copy is dropped once the files it started from change (git checkout, pull, hand edit).
import { sameFiles, type ContentStore, type Saved } from "./files";
import { localStore } from "./local-store";
import { readJson, writeJson } from "./storage";

const KEY = "fusian-edit-browser";

export const browserStore: ContentStore = {
  async load() {
    const files = await localStore.load();
    const kept = readJson<Saved>(KEY);
    return kept && sameFiles(kept, files) ? kept : files;
  },
  async save(draft, saved) {
    // shas stay those of the files on disk, so load() still notices when they change
    const next = { content: draft, shas: saved.shas };
    if (!writeJson(KEY, next)) {
      throw new Error("Not enough browser storage (photos are big). Remove some photos and save again.");
    }
    return { saved: next };
  },
};
