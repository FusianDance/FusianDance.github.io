// Browser storage for edit mode. Every access is guarded: storage can be blocked (privacy settings) or full.
type Area = "local" | "session";
const area = (where: Area) => (where === "session" ? sessionStorage : localStorage);

export function readText(key: string, where: Area = "local") {
  try {
    return area(where).getItem(key);
  } catch {
    return null;
  }
}

/** null for missing or unreadable (e.g. hand-edited) values. */
export function parseJson<T>(text: string | null): T | null {
  try {
    return JSON.parse(text ?? "null");
  } catch {
    return null;
  }
}

export const readJson = <T>(key: string, where: Area = "local") => parseJson<T>(readText(key, where));

/** null removes the key. false if the browser refused (blocked or full). */
export function writeJson(key: string, value: unknown, where: Area = "local") {
  try {
    if (value == null) area(where).removeItem(key);
    else area(where).setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
