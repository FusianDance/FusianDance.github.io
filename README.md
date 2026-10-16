# Fusian Dance Crew Website

**[https://fusiandance.github.io](https://fusiandance.github.io)**

Source of the website of **Fusian Dance Crew**, a dance crew in Munich founded in 2017: events, Instagram gallery, about page and contact info. Crew members edit the content right on the site (see Edit Mode below), without git.

Built with React Router 8 (static prerender), React 19, TypeScript, Tailwind CSS and shadcn/ui, hosted on GitHub Pages.

## 🚀 Getting Started

### Prerequisites

- Node.js 26 (CI uses 26; 22.22+ works)
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

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the static site into `build/client/`
- `npm run typecheck` - Generate route types and run the TypeScript check
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting (CI runs this)

## 🏗️ Tech Stack

- **Framework**: React Router 8 (framework mode, static prerender) on Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Theme**: next-themes

## 📦 Project Structure

```
FusianDance.github.io/
├── src/
│   ├── routes/              # Pages (each with a build-time loader)
│   ├── routes.ts            # Route config (feature-flagged routes live here)
│   ├── root.tsx             # HTML shell, navbar, footer
│   ├── components/          # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utilities and configurations
│       ├── models/         # TypeScript type definitions
│       └── utils.ts        # Utility functions
├── data/                   # Site content (YAML, Markdown), read at build time
├── apps-script/            # Edit-mode login (Google Apps Script)
├── docs/                   # Edit-mode setup and troubleshooting
├── scripts/                # Self-check for src/lib/content.ts
├── public/                 # Static assets
└── .github/workflows/      # GitHub Actions workflows
```

## ✏️ Editing Content

Site content lives in `data/` as YAML and is read at build time. Edit it with the edit mode (below) or with a pull request. Merging to `main` deploys the site.

| File                     | What it holds                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `data/announcements.yml` | `title`, `content`, `date`. The date is ISO 8601 with offset, e.g. `2025-10-20T22:00:00+02:00`                                 |
| `data/insta-posts.yml`   | `url` only, newest first. Use the canonical form `https://www.instagram.com/p/<id>/` or `https://www.instagram.com/reel/<id>/` |
| `data/about.md`          | The about page, GitHub flavored Markdown. Photos go in `public/uploads/`                                                       |
| `data/contact.yml`       | Contact info and training hours                                                                                                |
| `data/privacy.md`        | The privacy policy at `/privacy` (linked in the footer and from the Google login). Hand edits only                             |

## 🖊️ Edit Mode (no git needed)

Crew members edit the site right on the site. The footer has a **Log in** button. After login, `/events`, `/gallery` and `/about` turn into editors, the navbar gets a Contact entry (`/edit/contact`, while editing) for the contact info and training hours, and floating icon buttons appear (hover for their names): **Log out** on the left, and on the right **Discard changes**, an **Edit/Preview** toggle (Preview shows the normal pages with your unsaved changes) and **Save**. The about page is GitHub flavored Markdown with a live preview: paste a link onto selected text to link it, and paste, drop or add photos (shrunk to max 1600px, saved to `public/uploads/`). **Save** writes all changes to `data/` (and new photos) as **one commit** on `main`, and the site redeploys in about 2 minutes. Unsaved changes are kept in the browser, so they survive a reload or a new login.

There is no server of our own:

```
Log in → Google's account picker ("Sign in with Google", pick any of your Google accounts)
          → back to the site with a Google ID token (proves which account you picked)
          → site sends it to the Apps Script web app, which checks it and the allowlist
          → answers with a GitHub App token (1h, this repo, contents only)
          → browser commits via the GitHub API
```

Each member logs in with their own Google account. Only the emails in the `ALLOWED_EMAILS` script property may edit; add or remove people there ([how](docs/edit-mode-setup.md#changing-things-later)).

Setup, maintenance and troubleshooting (GitHub App, Google login, Apps Script): [docs/edit-mode-setup.md](docs/edit-mode-setup.md).

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

The static files will be generated in the `build/client` directory.

Feature flags are `FEATURE_<KEY>=true` environment variables read at build time (and in dev), e.g. `FEATURE_AUDITION=true npm run build`. A flagged route is defined conditionally in `src/routes.ts` with a matching entry in `src/lib/models/nav-item.ts`; disabled pages are not built at all.

## 🔄 CI/CD Workflows

The project uses GitHub Actions for automated building, testing, and deployment with two main workflows:

### Build Workflow (`build.yml`)

**Reusable workflow** that runs for both PR checks and deployments:

- Installs dependencies and caches npm packages
- Runs ESLint for code quality
- Performs TypeScript type checking
- Checks formatting with Prettier
- Builds the static site
- Uploads build artifacts for sharing between jobs

**Triggers:**

- Pull requests to `main` branch
- Called by deploy workflow

### Deploy Workflow (`deploy.yml`)

**Production deployment** workflow:

- Uses the build workflow as a reusable action
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

Add the route in `src/routes.ts` and a nav entry in `src/lib/models/nav-item.ts`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to Fusian Dance Crew.
