// The repo on GitHub, branch TARGET (main in production): reads files with the Contents API and saves all
// changes as one commit with the Git Data API.
import { clearToken, getToken } from "./auth";
import { changes, FILES, loadFiles, savedAfter, type ContentStore, type FileKey } from "./files";
import { TARGET } from "./target";

export const API = "https://api.github.com/repos/FusianDance/FusianDance.github.io";

async function gh<T>(path: string, body?: { method: string; json: unknown }): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Your login expired. Log in again to save.");
  const res = await fetch(API + path, {
    method: body?.method ?? "GET",
    cache: "no-store", // a cached ref/file would hide someone else's commit
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: body && JSON.stringify(body.json),
  });
  if (res.status === 401) clearToken(); // expired: the bar offers to log in again, the draft stays
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`GitHub ${res.status}: ${message}`);
  }
  return res.json();
}

const decode = (base64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function read(key: FileKey, ref: string) {
  const file = await gh<{ sha: string; content: string }>(`/contents/${FILES[key]}?ref=${ref}`);
  return { sha: file.sha, text: decode(file.content) };
}

export const githubStore: ContentStore = {
  load: () => loadFiles((key) => read(key, TARGET)),
  async save(draft, saved) {
    const head = (await gh<{ object: { sha: string } }>(`/git/ref/heads/${TARGET}`)).object.sha;
    const { files, photos } = await changes(draft, saved, (key) => read(key, head));
    const tree: { path: string; mode: string; type: string; content?: string; sha?: string }[] = files.map(
      ({ path, text }) => ({ path, mode: "100644", type: "blob", content: text }),
    );
    // Photos: binary, so they go up as blobs first.
    for (const [path, dataUrl] of photos) {
      const blob = await gh<{ sha: string }>("/git/blobs", {
        method: "POST",
        json: { content: dataUrl.slice(dataUrl.indexOf(",") + 1), encoding: "base64" },
      });
      tree.push({ path: `public${path}`, mode: "100644", type: "blob", sha: blob.sha });
    }
    const baseTree = (await gh<{ tree: { sha: string } }>(`/git/commits/${head}`)).tree.sha;
    const newTree = await gh<{ sha: string }>("/git/trees", { method: "POST", json: { base_tree: baseTree, tree } });
    const message = `content: update ${files.map((f) => f.key).join(", ") || "photos"} via edit mode`;
    const commit = await gh<{ sha: string }>("/git/commits", {
      method: "POST",
      json: { message, tree: newTree.sha, parents: [head] },
    });
    // not forced: fails if the branch moved since we read it, so nothing gets overwritten
    await gh(`/git/refs/heads/${TARGET}`, { method: "PATCH", json: { sha: commit.sha } });
    // Re-reading the branch right away can return the old files, so the new saved state comes from what we sent.
    return { saved: await savedAfter(draft, saved, files), commit: commit.sha };
  },
};
