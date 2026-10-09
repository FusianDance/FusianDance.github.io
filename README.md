# Fusian Dance Crew Website

**[https://fusiandance.github.io](https://fusiandance.github.io)**

A modern Next.js website for Fusian Dance Crew built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FusianDance/FusianDance.github.io.git
cd FusianDance.github.io
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Theme**: next-themes

## 📦 Project Structure

```
FusianDance.github.io/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utilities and configurations
│       ├── models/         # TypeScript type definitions
│       └── utils.ts        # Utility functions
├── data/                   # Site content as YAML, read at build time
├── scripts/                # Feature flags + content.mjs (content updates)
├── public/                 # Static assets
└── .github/workflows/      # GitHub Actions workflows
```

## ✏️ Editing Content

Site content lives in `data/` as YAML and is read at build time. Edit it with a pull request. Merging to `main` deploys the site.

| File | What it holds |
|---|---|
| `data/announcements.yml` | `title`, `content`, `date`. The date is ISO 8601 with offset, e.g. `2025-10-20T22:00:00+02:00` |
| `data/insta-posts.yml` | `url` only, newest first. Use the canonical form `https://www.instagram.com/p/<id>/` or `https://www.instagram.com/reel/<id>/` |
| `data/contact.yml` | Contact info and training hours |

### Without editing files

The **Add Announcement** and **Add Instagram Post** workflows (Actions tab → pick the workflow → Run workflow) open a PR for you. The date input uses the format `YYYY-MM-DD HH:MM` in Munich time.

### Entries from the Google Form

Entries with `source: sheet` are owned by the Google Form sync. They are rewritten on every run. To change or delete them, edit the sheet instead (see below).

## 📝 Google Form (members without git)

Members without git can add announcements and Instagram posts through a Google Form. It needs no server of our own, only Google Forms/Sheets and GitHub Actions.

```
Google Form (sign-in required, verified emails)
  → "Form Responses 1" tab (all answers + email)        [private]
  → "Allowed" tab (allowlist of emails)                 [private]
  → "Public" tab (formula: allowlisted rows, no emails) → published as CSV
  → hourly GitHub Action: fetch CSV → update data/*.yml → commit to main → deploy
```

### 1. The form

Settings → Responses → **Collect email addresses: Verified**. People must sign in with a Google account, and Google records their real address.

Use sections that branch on the first answer:

| Section | Questions |
|---|---|
| 1 | **Type** (multiple choice, required): `Announcement` / `Instagram post`. In the ⋮ menu → *Go to section based on answer*: Announcement → section 2, Instagram post → section 3 |
| 2 – Announcement | **Title** (short answer, required), **Content** (paragraph, required), **Date** (date with time, optional; empty = submission time). After section → *Submit form* |
| 3 – Instagram post | **Post URL** (short answer, required, validate with the regex `^https://www\.instagram\.com/(p\|reel)/[A-Za-z0-9_-]+/?`). After section → *Submit form* |

Share the form link only in the club chat. Only maintainers get edit access to the form and the sheet.

### 2. The sheet

Link the form to a sheet. That creates the `Form Responses 1` tab, with columns: Timestamp, Email Address, Type, Title, Content, Date, Post URL.

- **`Allowed` tab:** one email address per row in column A.
- **`Public` tab:** one formula in A1. The column letters depend on the real response sheet, so check them when you set it up.

```
={"timestamp","type","title","content","date","post_url";
  IFERROR(FILTER(
    {TEXT('Form Responses 1'!A2:A,"yyyy-mm-dd hh:mm:ss"),
     'Form Responses 1'!C2:C, 'Form Responses 1'!D2:D, 'Form Responses 1'!E2:E,
     TEXT('Form Responses 1'!F2:F,"yyyy-mm-dd hh:mm"),
     'Form Responses 1'!G2:G},
    'Form Responses 1'!A2:A<>"",
    COUNTIF(Allowed!A:A, 'Form Responses 1'!B2:B) > 0
  ))}
```

The email column is not included. Dates become ISO text, so the CSV does not depend on the sheet's language and region.

**Publish:** File → Share → Publish to web → choose **only the `Public` tab** → CSV, with "Automatically republish" ticked.

> ⚠️ Never publish the whole document or the responses tab. Anyone with that URL could read every email address.

### 3. The repo

1. Add the published CSV URL as a repo variable: Settings → Secrets and variables → Actions → Variables → `SHEET_CSV_URL`. It is public anyway, so it does not need to be a secret.
2. The **Sync Google Form** workflow (`.github/workflows/sheet-sync.yml`) runs every hour. You can also run it by hand from the Actions tab.
3. If the data changed, it commits to `main` and deploys. So `GITHUB_TOKEN` must be allowed to push to `main` (no blocking branch protection for it).

### Managing the allowlist

- **Add someone:** add their email to column A of the `Allowed` tab.
- **Remove someone:** delete their email from column A. Their entries disappear on the next run.
- Rows from emails that are not on the list are ignored, not deleted. If you add the email later, the rows appear on the next run.
- Delete stale rows from the responses tab by hand now and then.
- To fix or remove an entry on the site, edit or delete its row in the sheet.

### Limitations

- Anyone with a Google account and the form link can submit. Their rows are ignored until allowlisted.
- Non-allowlisted rows (and their emails) pile up in the private responses tab. Clean them by hand.
- Changes show up within about an hour, plus a few minutes of Google caching.
- GitHub turns off scheduled workflows after 60 days with no repo activity. Re-enable it in the Actions tab.

## 🚀 Deployment

This project is configured to deploy automatically to GitHub Pages when changes are pushed to the `main` branch.

### Setting up GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The site will be available at `https://YOUR_USERNAME.github.io`

### Manual Deployment

To deploy manually:

```bash
npm run build
```

The static files will be generated in the `out` directory.

## 🔄 CI/CD Workflows

The project uses GitHub Actions for automated building, testing, and deployment with two main workflows:

### Build Workflow (`build.yml`)
**Reusable workflow** that runs for both PR checks and deployments:
- Installs dependencies and caches npm packages
- Runs ESLint for code quality
- Performs TypeScript type checking
- Builds the application (standard or static export)
- Uploads build artifacts for sharing between jobs

**Triggers:**
- Pull requests to `main` branch (with standard build)
- Called by deploy workflow (with static export for GitHub Pages)

### Deploy Workflow (`deploy.yml`)
**Production deployment** workflow:
- Uses the build workflow as a reusable action with static export enabled
- Downloads build artifacts from the build job
- Configures GitHub Pages
- Deploys the static site to GitHub Pages

**Triggers:**
- Pushes to `main` branch
- Manual workflow dispatch

### Benefits of This Setup
- **No Code Duplication**: Build logic is centralized in one reusable workflow
- **Efficient Artifact Sharing**: Build artifacts are shared between jobs
- **Consistent Builds**: Same build process for PRs and production
- **Faster Deployments**: Deploy job only handles deployment, not building

## 🎨 Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: Automatic theme switching with next-themes
- **Navigation**: Persistent navbar and footer across all pages
- **Events Timeline**: Dynamic events display with past/future separation
- **Announcements**: Announcements from `data/announcements.yml`
- **Contact Form**: Static contact page with studio information
- **Type Safety**: Full TypeScript implementation

## 📝 Content Management

### Adding Navigation Items
Edit `src/components/navbar.tsx` to add new navigation items:

```typescript
export const navigationItems = [
  { title: "New Page", href: "/new-page" },
  // ... existing items
];
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to Fusian Dance Crew.