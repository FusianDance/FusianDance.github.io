# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Website for Fusian Dance Crew, deployed to GitHub Pages at https://fusiandance.github.io. React Router 8 (framework mode) on Vite 8, React 19, TypeScript 6, Tailwind CSS v4, shadcn/ui (base-vega style on Base UI, lucide icons), ESLint + Prettier.

## Commands

```bash
npm run dev            # dev server
npm run build          # prerender to build/client/
npm run typecheck      # react-router typegen && tsc (CI runs this)
npm run lint           # eslint
npm run format         # prettier --write (format:check in CI)
FEATURE_AUDITION=true npm run build   # build with a feature flag enabled (works for dev too)
node --test "scripts/*.test.mjs"   # self-check for scripts/content.mjs
```

The only tests are `scripts/*.test.mjs`. CI (`.github/workflows/build.yml`) runs them, lint, format check, typecheck, and build on PRs.

TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TS 7 yet.

## Architecture

**Static prerender only.** `react-router.config.ts` sets `appDirectory: "src"`, `ssr: false`, `prerender: true`: every route in `src/routes.ts` is rendered to `build/client/<route>/index.html` at build time. No server runtime: route `loader`s only run at build time, so anything that must change without a redeploy has to be fetched client-side. `npm run build` copies the SPA fallback to `404.html` for GitHub Pages.

**Content lives in `data/*.yml`, not in code.** `src/lib/data.server.ts` reads `announcements.yml`, `insta-posts.yml` and `contact.yml` with `fs`; the `.server` suffix makes React Router refuse to bundle it for the client, so import it only from route `loader`s (`src/root.tsx` loads `contact` for the footer). Components get the data via `loaderData` props. Anything that depends on the current time (past/upcoming split) uses `useNow(buildTime)` from `src/lib/hooks/use-now.ts`, with `buildTime` returned by the loader: it renders with the build time (matching the prerendered HTML) and switches to the real time after mount. Announcement `date` is ISO 8601 with offset; dates are formatted with `timeZone: "Europe/Berlin"` so build and browser agree. Instagram posts are stored as canonical post URLs only; `PostCard` builds the embed HTML from them, so `data.server.ts` rejects any URL that isn't `https://www.instagram.com/(p|reel)/<id>/`.

**Content workflows.** All writes to the YAML files go through `scripts/content.mjs` (preserves comments and manual entries). `data/` is in `.prettierignore` so Prettier doesn't fight its output. `announcement-add.yml` / `insta-post-add.yml` (`workflow_dispatch`) add an entry and open a PR. `sheet-sync.yml` runs hourly: it fetches the published Google Sheet CSV (`vars.SHEET_CSV_URL`), replaces every entry tagged `source: sheet` with the current sheet rows, commits to `main`, and calls `deploy.yml` via `workflow_call` (a `GITHUB_TOKEN` push doesn't trigger it). Never hand-edit `source: sheet` entries; the next sync overwrites them. Merging to `main` triggers `deploy.yml`, which calls `build.yml` and publishes `build/client/` to Pages.

**Feature flags.** `FEATURE_<KEY>=true` env vars, read directly: `src/routes.ts` adds the flagged route only when its flag is set (via `process.env`), and `NavItems` in `src/lib/models/nav-item.ts` adds the matching nav entry (via `import.meta.env`; `vite.config.ts` exposes the `FEATURE_` prefix). Disabled pages aren't built or prerendered, in dev too. To add a flagged page, add both entries. In production, flags come from the deploy workflow's `additional_build_env` input (persisted in the `LAST_DEPLOY_ENV` repo variable; pass `DELETE` to clear).

**Layout.** `src/root.tsx` is the HTML shell (`Layout`) and wraps every page with `ThemeProvider` (next-themes, class-based, works outside Next), `Navbar`, and `Footer`; its `ErrorBoundary` renders 404s. Use `Link` from `react-router` for internal links, plain `<a>` for external ones. shadcn primitives are in `src/components/ui/`; add new ones via `npx shadcn@latest add` (`components.json` aliases use `@/`).
