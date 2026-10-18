import { useEffect, useState } from "react";
import { API, REPO } from "./github-store";
import { TARGET } from "./target";

/** main deploys with deploy.yml. A branch (dev) never deploys; its CI build (build.yml) only runs when it has
 * a PR into main, so a missing run is only waited for a minute. */
const WORKFLOW = TARGET === "main" ? "deploy.yml" : "build.yml";

/** What the edit bar says about the WORKFLOW run. */
export const DEPLOY_TEXT =
  TARGET === "main"
    ? {
        running: "Updating the site (about 2 minutes). Until then it shows the old content.",
        failed: "The last site update failed, so it shows old content.",
      }
    : { running: `Building ${TARGET} (CI check).`, failed: `The last build of ${TARGET} failed.` };
export const DEPLOY_DETAILS_URL = `https://github.com/${REPO}/actions/workflows/${WORKFLOW}`;

/** The WORKFLOW run of `commit` (a sha just saved, whose run may not exist yet), else the latest one on TARGET:
 * "running" until it finished, then "failed" or null. Without auth: the edit token may only touch file contents.
 * That allows 60 requests/h per IP, so it checks once and then only polls while a run is pending. */
export function useDeploy(active: boolean, commit: string | null) {
  const [state, setState] = useState<"running" | "failed" | null>(null);
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    let misses = 0;
    async function poll() {
      if (!document.hidden) {
        const filter = commit ? `head_sha=${commit}` : `branch=${encodeURIComponent(TARGET)}`;
        const res = await fetch(`${API}/actions/workflows/${WORKFLOW}/runs?${filter}&per_page=1`, {
          cache: "no-store",
        }).catch(() => null);
        if (stopped) return;
        if (res?.ok) {
          type Run = { status: string; conclusion: string | null };
          const run = ((await res.json()) as { workflow_runs: Run[] }).workflow_runs[0];
          if (stopped) return;
          const waiting = commit && !run && (TARGET === "main" || ++misses < 3);
          const next =
            waiting || (run && run.status !== "completed")
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
