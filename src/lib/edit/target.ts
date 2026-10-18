// Where edit mode loads from and saves to, fixed at build time by EDIT_TARGET (vite.config.ts):
// always "main" in builds; in dev "browser" (default), "local" or a branch name.
export const TARGET: string = import.meta.env.EDIT_TARGET ?? "main";
/** browser and local: the working tree through the dev server, no Google login. */
export const LOCAL = TARGET === "browser" || TARGET === "local";
/** Shown on every page while TARGET isn't main, so nobody mistakes it for the real thing. */
export const TARGET_NOTE =
  TARGET === "main"
    ? null
    : TARGET === "browser"
      ? "Browser mode: Save keeps your edits in this browser only, no files change."
      : TARGET === "local"
        ? "Local mode: Save writes data/ and public/uploads/ in your working tree."
        : `Branch mode: Save commits to ${TARGET}, not main.`;
/** Tooltip of the on/off button on a flagged page's navbar entry. */
export const pageToggleHint = (title: string) =>
  TARGET === "browser"
    ? `${title} page: in browser mode, turn pages on or off in data/pages.yml`
    : `${title} page online (after Save and deploy)`;
/** Added to "Saved." when the Save switched pages on or off: when that takes effect. */
export const PAGES_SAVED_NOTE =
  TARGET === "main"
    ? "New or hidden pages show after the site update."
    : TARGET === "browser"
      ? "Page switches don't change what's built in browser mode: turn pages on or off in data/pages.yml."
      : TARGET === "local"
        ? "The dev server restarts to pick up the page switch."
        : `Page switches take effect once ${TARGET} is deployed.`;
