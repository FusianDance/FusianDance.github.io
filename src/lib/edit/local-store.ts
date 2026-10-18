// The working tree, through the dev server's /__edit endpoint (vite.config.ts). It only accepts writes
// when EDIT_TARGET=local.
import { gitBlobSha } from "@/lib/content";
import { changes, FILES, loadFiles, savedAfter, type ContentStore, type FileKey } from "./files";

async function read(key: FileKey) {
  const res = await fetch(`/__edit/${FILES[key]}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${FILES[key]}: the dev server answered ${res.status}.`);
  const text = await res.text();
  return { text, sha: await gitBlobSha(text) };
}

async function put(path: string, body: BodyInit) {
  const res = await fetch(`/__edit/${path}`, { method: "PUT", body });
  if (!res.ok) throw new Error(`Writing ${path} failed: the dev server answered ${res.status}.`);
}

export const localStore: ContentStore = {
  load: () => loadFiles(read),
  async save(draft, saved) {
    const { files, photos } = await changes(draft, saved, read);
    for (const { path, text } of files) await put(path, text);
    for (const [path, dataUrl] of photos) await put(`public${path}`, await (await fetch(dataUrl)).blob());
    return { saved: await savedAfter(draft, saved, files) };
  },
};
