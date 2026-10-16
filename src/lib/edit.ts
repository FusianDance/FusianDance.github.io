// Edit mode: edits data/* in the GitHub repo straight from the browser, no server of our own.
// Login: the footer "Log in" button sends the browser to Google's account picker ("Sign in with Google"),
// which comes back to / with a Google ID token in the hash. The site POSTs that to the Apps Script web app
// (apps-script/Code.gs), which checks it and the email allowlist and answers with a 1h GitHub App token.
// Edits are a draft in localStorage (survives reloads and re-login) and get saved as one commit to main,
// which triggers deploy.yml.
import { useMemo, useSyncExternalStore } from "react";
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
const FILES = {
  announcements: "data/announcements.yml",
  posts: "data/insta-posts.yml",
  about: "data/about.md",
  contact: "data/contact.yml",
} as const;
type FileKey = keyof typeof FILES;
const KEYS = Object.keys(FILES) as FileKey[];

export type Draft = {
  announcements: AnnouncementEntry[];
  posts: PostEntry[];
  about: string;
  contact: Contact;
  /** Photos pasted into the about page and not yet in the repo: "/uploads/<name>.jpg" → data URL. */
  uploads: Record<string, string>;
};
/** draft = being edited, base = as loaded from GitHub, shas = blob shas of the loaded files (conflict check),
 * preview = show the pages with the draft instead of the editors. */
export type Session = { draft: Draft; base: Draft; shas: Record<FileKey, string>; preview?: boolean };
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

const notExpired = (t: Token) => Date.parse(t.expires) > Date.now() + 60_000;

/** The GitHub token, or null when logged out or about to expire. */
export const useToken = () => useStored<Token>(TOKEN_KEY, notExpired)?.token ?? null;
export const useSession = () => useStored<Session>(SESSION_KEY);
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
  const file = await gh<{ sha: string; content: string }>(token, `/contents/${FILES[key]}?ref=${ref}`);
  return { sha: file.sha, text: decode(file.content) };
}

/** Loads the current files from main and starts a fresh draft. */
export async function startSession(token: string) {
  const files = await Promise.all(KEYS.map((key) => getFile(token, key, "main")));
  const base = Object.fromEntries(
    KEYS.map((key, i) => [key, key === "about" ? files[i].text : (parse(files[i].text) ?? [])]),
  ) as Omit<Draft, "uploads">;
  const shas = Object.fromEntries(KEYS.map((key, i) => [key, files[i].sha])) as Session["shas"];
  const draft = { ...base, uploads: {} };
  write(SESSION_KEY, { draft, base: draft, shas } satisfies Session);
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
  if (key === "about") return draft.about.endsWith("\n") ? draft.about : draft.about + "\n";
  if (key === "announcements") {
    return toYaml(
      fileText,
      [...draft.announcements].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    );
  }
  return toYaml(fileText, draft[key]);
}

/** Commits all changed files (and the photos the about page uses) as one commit on main.
 * Afterwards the saved draft is the new base. */
export async function save(token: string, { draft, base, shas }: Session) {
  const changed = KEYS.filter((key) => JSON.stringify(draft[key]) !== JSON.stringify(base[key]));
  if (!changed.length) return;
  const head = (await gh<{ object: { sha: string } }>(token, "/git/ref/heads/main")).object.sha;
  const tree: { path: string; mode: string; type: string; content?: string; sha?: string }[] = [];
  const newShas = { ...shas };
  for (const key of changed) {
    const file = await getFile(token, key, head);
    if (file.sha !== shas[key]) {
      throw new Error(
        `${FILES[key]} was changed by someone else since you started editing. Cancel and redo your edits.`,
      );
    }
    const content = serialize(key, draft, file.text);
    tree.push({ path: FILES[key], mode: "100644", type: "blob", content });
    newShas[key] = await gitBlobSha(content);
  }
  // Photos: binary, so they go up as blobs first. Ones deleted from the text again are dropped.
  for (const [path, dataUrl] of Object.entries(draft.uploads)) {
    if (path in base.uploads || !draft.about.includes(path)) continue;
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
  // not forced: fails if main moved since we read it, so nothing gets overwritten
  await gh(token, "/git/refs/heads/main", { method: "PATCH", json: { sha: commit.sha } });
  // Re-reading main right away can return the old files, so the new base comes from what we sent.
  // Edits typed while saving stay in the draft. Saved photos stay in uploads so the preview shows them
  // until the deploy is live; Log out clears them.
  const current = JSON.parse(read(SESSION_KEY) ?? "null") as Session | null;
  if (current) write(SESSION_KEY, { ...current, base: draft, shas: newShas } satisfies Session);
}
