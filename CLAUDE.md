# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Website for Fusian Dance Crew, deployed to GitHub Pages at https://fusiandance.github.io. Next.js 15 (app router) + React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style, lucide icons), Zustand.

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # runs prebuild (feature flags) then static export to out/
npm run lint           # next lint
npx tsc --noEmit       # typecheck (CI runs this)
FEATURE_AUDITION=true npm run build   # build with a feature flag enabled
```

There is no test suite. CI (`.github/workflows/build.yml`) runs lint, typecheck, and build on PRs.

## Architecture

**Static export only.** `next.config.ts` sets `output: 'export'`, `trailingSlash: true`, unoptimized images. No server runtime, API routes, or server-side data — anything dynamic must be fetched client-side.

**Content lives in `public/*.json`, not in code.** `public/announcements.json` and `public/insta-posts.json` are fetched at runtime in the browser by Zustand stores in `src/lib/state/` (`announcement.state.ts`, `insta-post.state.ts`). The stores kick off the fetch on creation and skip it on the server (`typeof window === "undefined"`). Fetch URLs are prefixed with `NEXT_PUBLIC_BASE_PATH`. Contact info and training hours are hardcoded in `src/lib/state/contact.ts`.

**Content workflows.** `announcement-add.yml` and `insta-post-add.yml` are `workflow_dispatch` jobs that append to those JSON files and open a PR. Merging to `main` triggers `deploy.yml`, which calls `build.yml` with `static_export: true` and publishes `out/` to Pages. Announcement `unixtimestamp` in the JSON is in **seconds** (the store multiplies by 1000).

**Feature flags.** `scripts/toggle-feature-flags.js` reads `FEATURE_<KEY>=true` env vars against its `featureFlags` list:
- as `prebuild`, it generates `src/config/nav-items.generated.ts` (nav entries for enabled features, merged with the fixed items in `src/lib/models/nav-item.ts`). Gitignored; don't hand-edit.
- as `postbuild` (`--postbuild`), it deletes disabled features' routes from `out/` (`out/<route>/` and `out/_next/static/chunks/app/<route>/`).

So disabled pages still compile but are not deployed; `npm run dev` always serves every page. To add a flagged page, add an entry to `featureFlags` in the script. In production, flags come from the deploy workflow's `additional_build_env` input (persisted in the `LAST_DEPLOY_ENV` repo variable; pass `DELETE` to clear).

**Layout.** `src/app/layout.tsx` wraps every page with `ThemeProvider` (next-themes, class-based), `Navbar`, and `Footer`. `/` renders `src/app/homepage/page.tsx`. shadcn primitives are in `src/components/ui/`; add new ones via the shadcn CLI (`components.json` aliases use `@/`).
