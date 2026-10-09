# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Website for Fusian Dance Crew, deployed to GitHub Pages at https://fusiandance.github.io. Next.js 15 (app router) + React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style, lucide icons).

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # runs prebuild (feature flags) then static export to out/
npm run lint           # next lint
npx tsc --noEmit       # typecheck (CI runs this)
FEATURE_AUDITION=true npm run build   # build with a feature flag enabled
node --test scripts/   # self-check for scripts/content.mjs
```

The only tests are `scripts/*.test.mjs`. CI (`.github/workflows/build.yml`) runs them, lint, typecheck, and build on PRs.

## Architecture

**Static export only.** `next.config.ts` sets `output: 'export'`, `trailingSlash: true`, unoptimized images. No server runtime or API routes: server components only run at build time, so anything that must change without a redeploy has to be fetched client-side.

**Content lives in `data/*.yml`, not in code.** `src/lib/data.ts` reads `announcements.yml`, `insta-posts.yml` and `contact.yml` with `fs` at build time, so it can only be imported from server components; pages pass the data to client components as props. Anything that depends on the current time (past/upcoming split) uses `useNow(buildTime)` from `src/lib/hooks/use-now.ts`: it renders with the build time (matching the static HTML) and switches to the real time after mount. Announcement `date` is ISO 8601 with offset; dates are formatted with `timeZone: "Europe/Berlin"` so build and browser agree. Instagram posts are stored as canonical post URLs only; `PostCard` builds the embed HTML from them, so `data.ts` rejects any URL that isn't `https://www.instagram.com/(p|reel)/<id>/`.

**Content workflows.** All writes to the YAML files go through `scripts/content.mjs` (preserves comments and manual entries). `announcement-add.yml` / `insta-post-add.yml` (`workflow_dispatch`) add an entry and open a PR. `sheet-sync.yml` runs hourly: it fetches the published Google Sheet CSV (`vars.SHEET_CSV_URL`), replaces every entry tagged `source: sheet` with the current sheet rows, commits to `main`, and calls `deploy.yml` via `workflow_call` (a `GITHUB_TOKEN` push doesn't trigger it). Never hand-edit `source: sheet` entries; the next sync overwrites them. Merging to `main` triggers `deploy.yml`, which calls `build.yml` with `static_export: true` and publishes `out/` to Pages.

**Feature flags.** `scripts/toggle-feature-flags.js` reads `FEATURE_<KEY>=true` env vars against its `featureFlags` list:
- as `prebuild`, it generates `src/config/nav-items.generated.ts` (nav entries for enabled features, merged with the fixed items in `src/lib/models/nav-item.ts`). Gitignored; don't hand-edit.
- as `postbuild` (`--postbuild`), it deletes disabled features' routes from `out/` (`out/<route>/` and `out/_next/static/chunks/app/<route>/`).

So disabled pages still compile but are not deployed; `npm run dev` always serves every page. To add a flagged page, add an entry to `featureFlags` in the script. In production, flags come from the deploy workflow's `additional_build_env` input (persisted in the `LAST_DEPLOY_ENV` repo variable; pass `DELETE` to clear).

**Layout.** `src/app/layout.tsx` wraps every page with `ThemeProvider` (next-themes, class-based), `Navbar`, and `Footer`. `/` renders `src/app/homepage/page.tsx`. shadcn primitives are in `src/components/ui/`; add new ones via the shadcn CLI (`components.json` aliases use `@/`).
