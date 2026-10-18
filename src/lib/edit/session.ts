// Edit mode: the content is edited in memory and Save hands it to the store for TARGET: GitHub (one commit on
// main, which triggers deploy.yml, or on a branch in dev), the working tree (local) or localStorage (browser).
// TARGET is fixed at build time, so the bundle only keeps the store it uses.
// Typing only touches memory. Unsaved edits are backed up to localStorage when the page is left or hidden, so
// they survive reloads, the login trip to Google and closing the tab.
import { useMemo, useSyncExternalStore } from "react";
import { toAnnouncements, toPosts } from "@/lib/content";
import type { Announcement } from "@/lib/models/announcement";
import type { InstaPost } from "@/lib/models/insta-post";
import { clearToken, finishGoogleLogin, googleLogin } from "./auth";
import { browserStore } from "./browser-store";
import { KEYS, type ContentStore, type Draft, type Saved } from "./files";
import { githubStore } from "./github-store";
import { localStore } from "./local-store";
import { TARGET } from "./target";

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
  dropBackup();
}

/** Loads the saved content from the store, and the unsaved edits on top if they are based on it. Once per page
 * load, after login. */
export function startSession() {
  loading ??= store.load().then(
    (saved) => {
      const kept = readBackup();
      if (kept && KEYS.every((key) => kept.saved.shas[key] === saved.shas[key])) {
        set({ draft: kept.draft, saved: kept.saved, preview: false });
      } else {
        if (kept) dropBackup(); // made on content that changed since (or in another mode)
        set({ draft: saved.content, saved, preview: false });
      }
    },
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
  dropBackup();
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

// ---- unsaved edits across reloads, logins and closed tabs

const BACKUP_KEY = "fusian-edit-draft";
/** The unsaved edits and the saved state they are based on, from the last time the page was left. */
type Backup = { target: string; draft: Draft; saved: Saved };

function readBackup() {
  try {
    const kept = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "null") as Backup | null;
    return kept?.target === TARGET ? kept : null;
  } catch {
    return null;
  }
}

function dropBackup() {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // storage blocked: there is no backup
  }
}

/** false if the unsaved edits didn't fit into localStorage (many big photos). Only Save, Discard and Log out
 * remove the backup, so a tab without edits never deletes another tab's. */
function backup() {
  if (!session || !isDirty(session)) return true;
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ target: TARGET, draft: session.draft, saved: session.saved }));
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  // ponytail: two tabs with unsaved edits share the one backup, the last one left wins.
  window.addEventListener("beforeunload", (event) => {
    if (!backup()) event.preventDefault(); // didn't fit: the browser asks "Leave site?"
  });
  window.addEventListener("pagehide", backup);
  document.addEventListener("visibilitychange", () => document.hidden && backup()); // phones skip pagehide
  try {
    localStorage.removeItem("fusian-edit-session"); // drafts of the old localStorage-based edit mode
  } catch {
    // storage blocked: nothing to clean up
  }
}

export const login = googleLogin;
export const finishLogin = finishGoogleLogin;

export function logout() {
  loading = null;
  set(null);
  dropBackup();
  clearToken();
}
