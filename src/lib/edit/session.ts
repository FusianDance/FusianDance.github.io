// Edit mode: the content is edited in memory and Save hands it to the store for TARGET: GitHub (one commit on
// main, which triggers deploy.yml, or on a branch in dev), the working tree (local) or localStorage (browser).
// TARGET is fixed at build time, so the bundle only keeps the store it uses.
// Unsaved edits are lost on reload, so the browser asks first; a re-login carries them through the trip to Google.
import { useMemo, useSyncExternalStore } from "react";
import { toAnnouncements, toPosts } from "@/lib/content";
import type { Announcement } from "@/lib/models/announcement";
import type { InstaPost } from "@/lib/models/insta-post";
import { clearToken, finishGoogleLogin, googleLogin } from "./auth";
import { browserStore } from "./browser-store";
import type { ContentStore, Draft, Saved } from "./files";
import { githubStore } from "./github-store";
import { localStore } from "./local-store";
import { LOCAL, TARGET } from "./target";

export type { Draft } from "./files";
export { problem } from "./files";

const store: ContentStore = TARGET === "browser" ? browserStore : TARGET === "local" ? localStore : githubStore;

/** draft = being edited, saved = as last saved (Discard goes back to it), preview = show the pages with the
 * draft instead of the editors. */
export type Session = { draft: Draft; saved: Saved; preview: boolean };

let session: Session | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Session | null) {
  session = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const useSession = () =>
  useSyncExternalStore(
    subscribe,
    () => session,
    () => null, // prerendered HTML: not editing
  );
export const useDraft = () => useSession()?.draft ?? null;
/** The draft while the pages show their editors (logged in, not previewing), else null. */
export function useEditDraft() {
  const session = useSession();
  return session && !session.preview ? session.draft : null;
}

export const isDirty = (s: Session) => JSON.stringify(s.draft) !== JSON.stringify(s.saved.content);

export function updateDraft(fn: (draft: Draft) => Draft) {
  if (session) set({ ...session, draft: fn(session.draft) });
}

export function setPreview(preview: boolean) {
  if (session) set({ ...session, preview });
}

export function discard() {
  if (session) set({ ...session, draft: session.saved.content });
}

/** Loads the saved content from the store. Once per page load, after login. */
export function startSession() {
  loading ??= store.load().then(
    (saved) => set({ draft: saved.content, saved, preview: false }),
    (e) => {
      loading = null;
      throw e;
    },
  );
  return loading;
}

/** Saves the draft and returns the commit (GitHub) or null. Edits typed while saving stay in the draft. */
export async function save() {
  const { draft, saved } = session!;
  const result = await store.save(draft, saved);
  if (session) set({ ...session, saved: result.saved });
  return result.commit ?? null;
}

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

// ---- unsaved edits across reloads and logins

const HANDOFF_KEY = "fusian-edit-unsaved"; // sessionStorage, only for the trip to Google and back
let leaving = false; // our own redirect to Google: no "leave site?" prompt, the edits travel along

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    if (!leaving && session && isDirty(session)) event.preventDefault(); // the browser asks "Leave site?"
  });
  window.addEventListener("pageshow", () => (leaving = false)); // back from Google via the back button
  try {
    localStorage.removeItem("fusian-edit-session"); // drafts of the old localStorage-based edit mode
  } catch {
    // storage blocked: nothing to clean up
  }
}

export function login() {
  if (!LOCAL && session && isDirty(session)) {
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(session));
    } catch {
      if (!confirm("Your unsaved changes are too big to keep through the login. Log in anyway and lose them?")) return;
    }
  }
  leaving = true;
  googleLogin();
}

/** Back from Google (see finishGoogleLogin): brings the unsaved edits back, also when the login failed. */
export function finishLogin() {
  const done = finishGoogleLogin();
  const unsaved = sessionStorage.getItem(HANDOFF_KEY);
  sessionStorage.removeItem(HANDOFF_KEY);
  if (unsaved) set(JSON.parse(unsaved));
  return done;
}

export function logout() {
  loading = null;
  set(null);
  clearToken();
}
