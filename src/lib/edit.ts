// Edit mode: edits data/* in the GitHub repo straight from the browser, no server of our own.
// Login: the footer "Log in" button sends the browser to Google's account picker ("Sign in with Google"),
// which comes back to / with a Google ID token in the hash. The site POSTs that to the Apps Script web app
// (apps-script/Code.gs), which checks it and the email allowlist and answers with a 1h GitHub App token.
// Edits are a draft in localStorage (survives reloads and re-login) and get saved as one commit to main,
// which triggers deploy.yml. In dev, EDIT_TARGET (vite.config.ts) picks another target: "browser" (default:
// local files, never saved), "local" (local files, Save writes them) or a branch name.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { parse } from "yaml";
import { gitBlobSha, toAnnouncements, toPosts, toYaml, type AnnouncementEntry, type PostEntry } from "./content";
import type { Announcement } from "./models/announcement";
import type { Contact } from "./models/contact";
import type { InstaPost } from "./models/insta-post";

// Both set during the one-time setup (README → Edit Mode). Neither is a secret.
// OAuth client from Google Cloud Console (Clients → Web application).
const GOOGLE_CLIENT_ID = "529886851662-d2brrv9g1odq1fuo8teasogk3tf7j2co.apps.googleusercontent.com";
// apps-script/Code.gs, Deploy → Manage deployments → Web app URL.
const LOGIN_URL =
  "https://script.google.com/macros/s/AKfycbyYA7QuRTNsGEYmsOUX0zlk1sYpAtlxxkMbX7HSvjb12LKrIkN3T5MystBD56W8p_lndw/exec";
const API = "https://api.github.com/repos/FusianDance/FusianDance.github.io";
/** "main" in builds. "browser" and "local" use the working tree via the dev server, without login. */
export const TARGET: string = import.meta.env.EDIT_TARGET ?? "main";
const LOCAL = TARGET === "browser" || TARGET === "local";
/** Shown on every page while TARGET isn't main, so nobody mistakes it for the real thing. */
export const TARGET_NOTE =
  TARGET === "main"
    ? null
    : TARGET === "browser"
      ? "Browser mode: Save keeps your edits in this browser only, no files change."
      : TARGET === "local"
        ? "Local mode: Save writes data/ and public/uploads/ in your working tree."
        : `Branch mode: Save commits to ${TARGET}, not main.`;
const FILES = {
  announcements: "data/announcements.yml",
  posts: "data/insta-posts.yml",
  about: "data/about.md",
  audition: "data/audition.md",
  contact: "data/contact.yml",
  pages: "data/pages.yml",
} as const;
type FileKey = keyof typeof FILES;
const KEYS = Object.keys(FILES) as FileKey[];
const isMarkdown = (key: FileKey): key is "about" | "audition" => FILES[key].endsWith(".md");

export type Draft = {
  announcements: AnnouncementEntry[];
  posts: PostEntry[];
  about: string;
  audition: string;
  contact: Contact;
  /** Flagged page key → enabled (data/pages.yml). Takes effect with the deploy after Save. */
  pages: Record<string, boolean>;
  /** Photos pasted into a Markdown page and not yet in the repo: "/uploads/<name>.jpg" → data URL. */
  uploads: Record<string, string>;
};
/** draft = being edited, base = as loaded, shas = blob shas of the loaded files (conflict check),
 * target = the TARGET it was loaded from, preview = show the pages with the draft instead of the editors. */
export type Session = { draft: Draft; base: Draft; shas: Record<FileKey, string>; target: string; preview?: boolean };
type Token = { token: string; expires: string };

// ---- localStorage-backed store (prerendered HTML renders without it, the client switches after hydration)

const TOKEN_KEY = "fusian-edit-token";
const SESSION_KEY = "fusian-edit-session";
const LOGIN_KEY = "fusian-edit-login"; // sessionStorage: survives the trip to Google and back
const listeners = new Set<() => void>();

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** false if the browser refused (storage blocked or full). */
function write(key: string, value: unknown) {
  let ok = true;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    ok = false;
  }
  listeners.forEach((fn) => fn());
  return ok;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn); // other tabs
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

const always = () => true;

function useStored<T>(key: string, valid: (value: T) => boolean = always): T | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  return useMemo(() => {
    const value = raw ? (JSON.parse(raw) as T) : null;
    return value && valid(value) ? value : null;
  }, [raw, valid]);
}

// In browser/local mode the "token" is the mode's name, so it never mixes with a GitHub token.
const usable = (t: Token) =>
  Date.parse(t.expires) > Date.now() + 60_000 && (LOCAL ? t.token === TARGET : !["browser", "local"].includes(t.token));

/** The GitHub token, or null when logged out or about to expire. */
export const useToken = () => useStored<Token>(TOKEN_KEY, usable)?.token ?? null;
// Drafts from another target (or from before targets, or before announcements had startDate): dropped,
// a fresh one is loaded from the current target.
const current = (s: Session) => s.target === TARGET && s.draft.announcements.every((a) => a.startDate);
export const useSession = () => useStored<Session>(SESSION_KEY, current);
export const useDraft = () => useSession()?.draft ?? null;
/** The draft while the pages show their editors (logged in, not previewing), else null. */
export function useEditDraft() {
  const session = useSession();
  return session && !session.preview ? session.draft : null;
}

export function setPreview(preview: boolean) {
  const session = JSON.parse(read(SESSION_KEY) ?? "null") as Session | null;
  if (session) write(SESSION_KEY, { ...session, preview });
}

/** false if the change didn't fit into browser storage (too many unsaved photos). */
export function updateDraft(fn: (draft: Draft) => Draft) {
  const session = JSON.parse(read(SESSION_KEY) ?? "null") as Session | null;
  return !!session && write(SESSION_KEY, { ...session, draft: fn(session.draft) });
}

export const isDirty = (s: Session) => JSON.stringify(s.draft) !== JSON.stringify(s.base);

/** Shows the draft instead of the build-time content while editing. */
export function useLiveContent<T extends { announcements?: Announcement[]; posts?: InstaPost[] }>(data: T): T {
  const draft = useDraft();
  return useMemo(
    () =>
      draft
        ? {
            ...data,
            ...(data.announcements && { announcements: toAnnouncements(draft.announcements) }),
            ...(data.posts && { posts: toPosts(draft.posts) }),
          }
        : data,
    [data, draft],
  );
}

// ---- login / logout

export function login() {
  if (LOCAL) return void write(TOKEN_KEY, { token: TARGET, expires: "9999-12-31T00:00:00Z" } satisfies Token);
  const state = crypto.randomUUID();
  sessionStorage.setItem(LOGIN_KEY, JSON.stringify({ state, path: location.pathname }));
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    response_type: "id_token",
    scope: "openid email",
    redirect_uri: location.origin + "/", // must be listed in the OAuth client
    prompt: "select_account",
    state,
    nonce: state,
  });
  location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

/** Back from Google: trades the ID token for a GitHub token. Call once on the client. Returns null if this
 * page load isn't a login, else a promise of the page the login started on. */
export function finishLogin(): Promise<string> | null {
  const hash = new URLSearchParams(location.hash.slice(1));
  const idToken = hash.get("id_token");
  if (!idToken && !hash.has("error")) return null;
  history.replaceState(history.state, "", location.pathname + location.search);
  const started = JSON.parse(sessionStorage.getItem(LOGIN_KEY) ?? "null") as { state: string; path: string } | null;
  sessionStorage.removeItem(LOGIN_KEY);
  return (async () => {
    if (!idToken) throw new Error(`Google login failed (${hash.get("error")}).`);
    // Only a login this tab started counts, so nobody can log you in with a link.
    if (!started || hash.get("state") !== started.state) throw new Error("Login failed, please try again.");
    type Answer = { token?: string; expires_at?: string; error?: string };
    const answer: Answer = await fetch(LOGIN_URL, { method: "POST", body: idToken }) // text/plain: no CORS preflight
      .then((res) => res.json())
      .catch(() => ({ error: "Could not reach the login script. Is it deployed with access for Anyone?" }));
    if (!answer.token || !answer.expires_at) throw new Error(answer.error ?? "Login failed.");
    write(TOKEN_KEY, { token: answer.token, expires: answer.expires_at } satisfies Token);
    return started.path;
  })();
}

export function logout() {
  write(SESSION_KEY, null);
  write(TOKEN_KEY, null);
}

// ---- GitHub

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gh<T>(token: string, path: string, body?: { method: string; json: unknown }): Promise<T> {
  const res = await fetch(API + path, {
    method: body?.method ?? "GET",
    cache: "no-store", // a cached ref/file would hide someone else's commit
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: body && JSON.stringify(body.json),
  });
  if (res.status === 401) write(TOKEN_KEY, null); // expired: the bar offers to log in again, the draft stays
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: res.statusText }));
    throw new GitHubError(res.status, `GitHub ${res.status}: ${message}`);
  }
  return res.json();
}

const decode = (base64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function getFile(token: string, key: FileKey, ref: string) {
  if (LOCAL) {
    const res = await fetch(`/__edit/${FILES[key]}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`${FILES[key]}: the dev server answered ${res.status}.`);
    const text = await res.text();
    return { sha: await gitBlobSha(text), text };
  }
  const file = await gh<{ sha: string; content: string }>(token, `/contents/${FILES[key]}?ref=${ref}`);
  return { sha: file.sha, text: decode(file.content) };
}

/** Loads the current files from TARGET and starts a fresh draft. */
export async function startSession(token: string) {
  const files = await Promise.all(KEYS.map((key) => getFile(token, key, TARGET)));
  const base = Object.fromEntries(
    KEYS.map((key, i) => [key, isMarkdown(key) ? files[i].text : (parse(files[i].text) ?? [])]),
  ) as Omit<Draft, "uploads">;
  const shas = Object.fromEntries(KEYS.map((key, i) => [key, files[i].sha])) as Session["shas"];
  const draft = { ...base, uploads: {} };
  write(SESSION_KEY, { draft, base: draft, shas, target: TARGET } satisfies Session);
}

/** Browser/local mode: drops the draft if the local files changed since it was loaded (git checkout, pull,
 * hand edit), so a fresh one is loaded. Call once per page load. */
export async function dropIfStale() {
  const session = JSON.parse(read(SESSION_KEY) ?? "null") as Session | null;
  if (!LOCAL || session?.target !== TARGET) return;
  const files = await Promise.all(KEYS.map((key) => getFile("", key, "")));
  if (KEYS.some((key, i) => files[i].sha !== session.shas[key])) write(SESSION_KEY, null);
}

/** What blocks saving, or null. */
export function problem({ announcements, contact }: Draft) {
  const bad = announcements.find((a) => !a.title.trim() || !a.content.trim());
  if (bad) return `Every event needs a title and a text${bad.title.trim() ? ` ("${bad.title}")` : ""}.`;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) return "Contact: the email address looks wrong.";
  if (!contact.instagram.startsWith("https://www.instagram.com/")) {
    return "Contact: the Instagram link must start with https://www.instagram.com/";
  }
  if (contact.trainingHours.some((t) => !t.day || !t.start || !t.end || !t.location.trim())) {
    return "Contact: every training needs a day, start, end and location.";
  }
  return null;
}

function serialize(key: FileKey, draft: Draft, fileText: string) {
  if (isMarkdown(key)) return draft[key].endsWith("\n") ? draft[key] : draft[key] + "\n";
  if (key === "announcements") {
    return toYaml(
      fileText,
      [...draft.announcements]
        .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
        .map(({ title, content, startDate, endDate, allDay }) => ({ title, content, startDate, endDate, allDay })),
    );
  }
  return toYaml(fileText, draft[key]);
}

/** The saved draft becomes the base (Discard goes back to it). Edits typed while saving stay in the draft. */
function rebase(draft: Draft, shas: Session["shas"]) {
  const current = JSON.parse(read(SESSION_KEY) ?? "null") as Session | null;
  if (current) write(SESSION_KEY, { ...current, base: draft, shas } satisfies Session);
}

/** Commits all changed files (and the photos the Markdown pages use) as one commit on TARGET and returns its sha.
 * Local mode writes them to disk instead, browser mode only keeps them in the browser; both return null.
 * Afterwards the saved draft is the new base. */
export async function save(token: string, { draft, base, shas }: Session) {
  const changed = KEYS.filter((key) => JSON.stringify(draft[key]) !== JSON.stringify(base[key]));
  if (!changed.length) return null;
  // shas stay those of the files on disk, so dropIfStale still notices a checkout or pull.
  if (TARGET === "browser") {
    rebase(draft, shas);
    return null;
  }
  const head = LOCAL ? "" : (await gh<{ object: { sha: string } }>(token, `/git/ref/heads/${TARGET}`)).object.sha;
  const tree: { path: string; mode: string; type: string; content?: string; sha?: string }[] = [];
  const newShas = { ...shas };
  for (const key of changed) {
    const file = await getFile(token, key, head);
    if (file.sha !== shas[key]) {
      throw new Error(
        `${FILES[key]} was changed elsewhere since you started editing. Discard your changes and redo them.`,
      );
    }
    const content = serialize(key, draft, file.text);
    tree.push({ path: FILES[key], mode: "100644", type: "blob", content });
    newShas[key] = await gitBlobSha(content);
  }
  // Photos: binary, so they go up as blobs first. Ones deleted from the text again are dropped.
  const photos = Object.entries(draft.uploads).filter(
    ([path]) => !(path in base.uploads) && [draft.about, draft.audition].some((text) => text.includes(path)),
  );
  if (LOCAL) {
    const put = async (path: string, body: BodyInit) => {
      const res = await fetch(`/__edit/${path}`, { method: "PUT", body });
      if (!res.ok) throw new Error(`Writing ${path} failed: the dev server answered ${res.status}.`);
    };
    for (const { path, content } of tree) await put(path, content!);
    for (const [path, dataUrl] of photos) await put(`public${path}`, await (await fetch(dataUrl)).blob());
    rebase(draft, newShas);
    return null;
  }
  for (const [path, dataUrl] of photos) {
    const blob = await gh<{ sha: string }>(token, "/git/blobs", {
      method: "POST",
      json: { content: dataUrl.slice(dataUrl.indexOf(",") + 1), encoding: "base64" },
    });
    tree.push({ path: `public${path}`, mode: "100644", type: "blob", sha: blob.sha });
  }
  const baseTree = (await gh<{ tree: { sha: string } }>(token, `/git/commits/${head}`)).tree.sha;
  const newTree = await gh<{ sha: string }>(token, "/git/trees", {
    method: "POST",
    json: { base_tree: baseTree, tree },
  });
  const commit = await gh<{ sha: string }>(token, "/git/commits", {
    method: "POST",
    json: { message: `content: update ${changed.join(", ")} via edit mode`, tree: newTree.sha, parents: [head] },
  });
  // not forced: fails if the branch moved since we read it, so nothing gets overwritten
  await gh(token, `/git/refs/heads/${TARGET}`, { method: "PATCH", json: { sha: commit.sha } });
  // Re-reading the branch right away can return the old files, so the new base comes from what we sent.
  // Saved photos stay in uploads so the preview shows them until the deploy is live; Log out clears them.
  rebase(draft, newShas);
  return commit.sha;
}

// ---- deploy status

/** The deploy.yml run of `commit` (a sha just saved, whose run may not exist yet), else the latest one on main:
 * "running" until it finished, then "failed" or null. Without auth: the edit token may only touch file contents.
 * That allows 60 requests/h per IP, so it checks once and then only polls while a run is pending. */
export function useDeploy(active: boolean, commit: string | null) {
  const [state, setState] = useState<"running" | "failed" | null>(null);
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    async function poll() {
      if (!document.hidden) {
        const filter = commit ? `head_sha=${commit}` : "branch=main";
        const res = await fetch(`${API}/actions/workflows/deploy.yml/runs?${filter}&per_page=1`, {
          cache: "no-store",
        }).catch(() => null);
        if (stopped) return;
        if (res?.ok) {
          type Run = { status: string; conclusion: string | null };
          const run = ((await res.json()) as { workflow_runs: Run[] }).workflow_runs[0];
          if (stopped) return;
          const next =
            (commit && !run) || (run && run.status !== "completed")
              ? "running"
              : run && run.conclusion !== "success"
                ? "failed"
                : null;
          setState(next);
          if (next !== "running") return;
        }
      }
      timer = setTimeout(poll, 20_000); // also retries after a network error or the rate limit
    }
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, commit]);
  return active ? state : null;
}
