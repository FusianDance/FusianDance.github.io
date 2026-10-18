import { useEffect, useState } from "react";
import { API } from "./github-store";

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
