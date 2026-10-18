// Login: the footer "Log in" button sends the browser to Google's account picker ("Sign in with Google"),
// which comes back to / with a Google ID token in the hash. The site POSTs that to the Apps Script web app
// (apps-script/Code.gs), which checks it and the email allowlist and answers with a 1h GitHub App token.
// In browser/local mode there is no GitHub: logging in just stores the mode's name as the "token".
import { useSyncExternalStore } from "react";
import { LOCAL, TARGET } from "./target";

// Both set during the one-time setup (README → Edit Mode). Neither is a secret.
// OAuth client from Google Cloud Console (Clients → Web application).
const GOOGLE_CLIENT_ID = "529886851662-d2brrv9g1odq1fuo8teasogk3tf7j2co.apps.googleusercontent.com";
// apps-script/Code.gs, Deploy → Manage deployments → Web app URL.
const LOGIN_URL =
  "https://script.google.com/macros/s/AKfycbyYA7QuRTNsGEYmsOUX0zlk1sYpAtlxxkMbX7HSvjb12LKrIkN3T5MystBD56W8p_lndw/exec";

type Token = { token: string; expires: string };
const TOKEN_KEY = "fusian-edit-token"; // localStorage: a login lasts across reloads and tabs
const LOGIN_KEY = "fusian-edit-login"; // sessionStorage: survives the trip to Google and back
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function write(token: Token | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: stays logged out
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn); // other tabs
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

// A local "token" is the mode's name, so it never mixes with a GitHub token.
function usable(raw: string | null) {
  const t = raw ? (JSON.parse(raw) as Token) : null;
  if (!t || Date.parse(t.expires) < Date.now() + 60_000) return null;
  return (LOCAL ? t.token === TARGET : !["browser", "local"].includes(t.token)) ? t.token : null;
}

/** The token, or null when logged out or about to expire. */
export const getToken = () => usable(read());
export const useToken = () =>
  usable(
    useSyncExternalStore(
      subscribe,
      read,
      () => null, // prerendered HTML: logged out
    ),
  );
export const clearToken = () => write(null);

export function googleLogin() {
  if (LOCAL) return write({ token: TARGET, expires: "9999-12-31T00:00:00Z" });
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
export function finishGoogleLogin(): Promise<string> | null {
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
    write({ token: answer.token, expires: answer.expires_at });
    return started.path;
  })();
}
