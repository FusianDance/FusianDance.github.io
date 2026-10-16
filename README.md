# Fusian Dance Crew Website

**[https://fusiandance.github.io](https://fusiandance.github.io)**

A modern React Router website for Fusian Dance Crew built with TypeScript, Tailwind CSS, and shadcn/ui components.

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
├── data/                   # Site content as YAML, read at build time
├── apps-script/            # Edit-mode login (Google Apps Script)
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

Crew members edit the site right on the site. The footer has an **Edit site** button. After login, `/events`, `/gallery` and `/about` turn into editors, `/edit/contact` edits the contact info and training hours, and a floating bar appears with **Cancel** and **Save**. The about page is GitHub flavored Markdown with a live preview: paste a link onto selected text to link it, and paste, drop or add photos (shrunk to max 1600px, saved to `public/uploads/`). **Save** writes all changes to `data/` (and new photos) as **one commit** on `main`, and the site redeploys in about 2 minutes. Unsaved changes are kept in the browser, so they survive a reload or a new login.

There is no server of our own:

```
Edit site → Google's account picker ("Sign in with Google", pick any of your Google accounts)
          → back to the site with a Google ID token (proves which account you picked)
          → site sends it to the Apps Script web app, which checks it and the allowlist
          → answers with a GitHub App token (1h, this repo, contents only)
          → browser commits via the GitHub API
```

Each member logs in with their own Google account. Only the emails in the `ALLOWED_EMAILS` script property (step 5) may edit; add or remove people there.

### One-time setup

You need: owner rights in the `FusianDance` GitHub org, admin rights on this repo, and the login of the crew Google account (`fusianmunich@gmail.com`), which owns the Google Cloud project and the Apps Script project. It takes about 30 minutes. Do the steps in this order.

#### 1. Create the GitHub App

The App is the identity that commits for the edit mode. It belongs to the org, so it does not depend on anyone's personal account.

1. Open [github.com/organizations/FusianDance/settings/apps/new](https://github.com/organizations/FusianDance/settings/apps/new).
   The way there by hand: click the org avatar → **Settings** → in the left sidebar, at the very bottom, **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. Fill in the form:
   - **GitHub App name:** `fusian-site-editor` (must be unique on all of GitHub; add a suffix if it is taken). It shows up as the author of the edit commits (`fusian-site-editor[bot]`).
   - **Homepage URL:** `https://fusiandance.github.io`
   - **Description:** optional, e.g. `Commits edits made in the website's edit mode.`
   - **Identifying and authorizing users:** leave **Redirect URI** empty and all checkboxes there unticked (the default tick on **Expire user authorization tokens** can stay, it does nothing here). The App never logs in users; the Apps Script uses the App's own key.
   - **Post installation:** leave **Setup URL** empty and **Redirect on update** unticked.
   - **Webhook:** untick **Active**. **Webhook URL** and **Secret** then disappear.
   - **Permissions → Repository permissions → Contents:** **Read and write**. Change nothing else, also not under Organization, Account or Enterprise permissions. **Metadata: Read-only** gets set automatically; that is expected.
   - **Where can this GitHub App be installed?** **Only on this account**.
3. Click **Create GitHub App**. You land on the App's settings page.
4. Note the **App ID** (a number near the top, under "About"). Do not confuse it with the Client ID (`Iv23…`).
5. Scroll down to **Private keys** → **Generate a private key**. The browser downloads a file like `fusian-site-editor.2026-10-16.private-key.pem`. Keep it for step 3, then delete it.
6. In the left sidebar of the App settings: **Install App** → **Install** next to `FusianDance` → **Only select repositories** → pick `FusianDance.github.io` → **Install**.
   Direct link: [github.com/organizations/FusianDance/settings/apps/fusian-site-editor/installations](https://github.com/organizations/FusianDance/settings/apps/fusian-site-editor/installations). Don't go through org **Settings** → **GitHub Apps** or the Marketplace: those only list apps already installed or apps from your personal account.
7. You land on a page whose URL ends in a number, like `github.com/organizations/FusianDance/settings/installations/12345678`. That number is the **Installation ID**. Note it.
   You can find this page again under org **Settings** → **GitHub Apps** (under "Integrations") → **Configure** next to the App.

#### 2. Let the App push to `main`

`main` has branch protection that requires a pull request with an approval. The edit mode commits straight to `main`, so the App must be allowed to skip that, or every Save fails with "Protected branch update failed".

1. Repo **Settings** → **Branches** → under "Branch protection rules", **Edit** next to `main`.
2. Under **Require a pull request before merging**, tick **Allow specified actors to bypass required pull requests** and add `fusian-site-editor` (type the name, pick the App).
3. **Save changes** at the bottom.

The `main` ruleset under **Settings → Rules → Rulesets** is currently disabled. If someone enables it, add the App to its **Bypass list** too.

#### 3. Convert the private key

GitHub hands out the key in PKCS#1 format (`BEGIN RSA PRIVATE KEY`). Apps Script needs PKCS#8 (`BEGIN PRIVATE KEY`), and the script property field takes a single line. In a terminal, in the folder with the `.pem` file:

```bash
openssl pkcs8 -topk8 -nocrypt -in fusian-site-editor.*.private-key.pem | awk '{printf "%s\\n", $0}' | pbcopy
```

This puts the key on the clipboard as one line with literal `\n` between the lines (`pbcopy` is macOS; on Linux drop `| pbcopy` and copy the output). It must start with `-----BEGIN PRIVATE KEY-----\n`. Paste it in step 5. Then delete the `.pem` file, and never commit it (`*.pem` is in `.gitignore`).

#### 4. Create the Google login (OAuth client)

This gives the site Google's account picker. It is free and needs no billing account. Do it signed in as `fusianmunich@gmail.com`.

1. Open [console.cloud.google.com](https://console.cloud.google.com). The first time, Google asks for your country and to accept the terms of service.
2. Create a project: click the project picker at the top left (it says "Select a project" or shows a project name) → **New project** → **Project name:** `fusian-site`, **Location:** No organization → **Create**. When the notification says it's ready, click **Select project**. Check that the picker at the top now shows `fusian-site`.
3. Set up the consent screen: open [console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview) (by hand: menu ☰ → **APIs & Services** → **OAuth consent screen**, which leads to "Google Auth Platform") → **Get started**:
   - **App information:** **App name** `Fusian`, **User support email** `fusianmunich@gmail.com` → **Next**.
   - **Audience:** **External** → **Next**.
   - **Contact information:** `fusianmunich@gmail.com` → **Next**.
   - **Finish:** tick that you agree to the Google API Services: User Data Policy → **Continue** → **Create**.
4. Publish it: left sidebar **Audience** → under "Publishing status" (it says **Testing**) click **Publish app** → **Confirm**. In Testing mode only listed test users could log in. The site only asks for the email address, which needs no Google review.
   If Google asks you to complete the branding first, left sidebar **Branding**:
   - **App name** `Fusian`, **User support email** `fusianmunich@gmail.com` (already filled in from step 3).
   - **App logo:** leave empty. A logo requires Google's verification, which takes days.
   - **Application home page:** `https://fusiandance.github.io`, **Application privacy policy link:** `https://fusiandance.github.io/privacy` (the page comes from `data/privacy.md`). Google won't publish without them. **Terms of Service:** leave empty.
   - **Authorised domains:** **Add domain** → `fusiandance.github.io`. This is the domain of the redirect URI from step 4.6. If Google already added it, leave it.
   - **Developer contact information:** `fusianmunich@gmail.com`.
   - **Save**, then **Publish app** again.
5. Leave **Data Access** (left sidebar) as it is. The site requests `openid email` on its own; nothing to add there.
6. Create the client: left sidebar **Clients** → **Create client**:
   - **Application type:** **Web application**
   - **Name:** `Fusian site`
   - **Authorized JavaScript origins:** leave empty.
   - **Authorized redirect URIs** → **Add URI**, twice: `https://fusiandance.github.io/` and `http://localhost:5173/`. Both exactly like this, with the trailing slash. Google sends people back here after they pick an account; nothing else may receive the login.
   - **Create**.
7. A popup shows the **Client ID**, like `123456789012-abc…xyz.apps.googleusercontent.com`. Copy it. You can find it again under **Clients**. The client secret is not used; ignore it.

Google says changes can take from 5 minutes to a few hours to apply. A fresh client usually works within minutes.

#### 5. Create the Apps Script project

Do this signed in as `fusianmunich@gmail.com`. It owns the script, the key and the allowlist; members never see them.

1. Open [script.google.com](https://script.google.com) → **New project** (top left). Apps Script is part of every Google account; nothing to install or enable.
2. Click "Untitled project" at the top and rename it to `Fusian edit login`.
3. The editor shows a file `Code.gs`. Delete its content, paste the full content of [`apps-script/Code.gs`](apps-script/Code.gs) from this repo, and save (⌘S / Ctrl+S).
4. In the left sidebar: **Project Settings** (gear icon) → scroll to **Script Properties** → **Add script property**, five times:

   | Property          | Value                                                                                         |
   | ----------------- | --------------------------------------------------------------------------------------------- |
   | `CLIENT_ID`       | Client ID from step 4.7                                                                       |
   | `ALLOWED_EMAILS`  | Google accounts that may edit, comma separated, e.g. `fusianmunich@gmail.com, anna@gmail.com` |
   | `APP_ID`          | App ID from step 1.4                                                                          |
   | `INSTALLATION_ID` | Installation ID from step 1.7                                                                 |
   | `PRIVATE_KEY`     | The one-line key from step 3 (clipboard)                                                      |

   Then **Save script properties**.

5. Top right: **Deploy** → **New deployment** → click the gear next to "Select type" → **Web app**:
   - **Description:** `edit login`
   - **Execute as:** **Me (fusianmunich@gmail.com)**
   - **Who has access:** **Anyone**. Not "Anyone with Google account": the site calls the script in the background, without Google cookies. The script itself only answers with a token for a valid Google login of an email in `ALLOWED_EMAILS`.
   - **Deploy**.
6. Google asks to authorize the script: **Authorize access** → pick `fusianmunich@gmail.com` → "Google hasn't verified this app" → **Advanced** → **Go to Fusian edit login (unsafe)** → tick **Select all** → **Continue**. The only permission is "Connect to an external service" (Google's token check and the GitHub API). The warning appears because the script is your own and unpublished. Only you see it, once; members never do.
7. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.
8. Test it: open that URL in a private window. It should say "Fusian edit login is running." If Google asks you to log in instead, **Who has access** is not **Anyone**.

Already deployed with other settings? **Deploy** → **Manage deployments** → pencil icon → **Version:** New version, set **Execute as** and **Who has access** as above → **Deploy**. This keeps the URL.

#### 6. Point the site at the login

1. In `src/lib/edit.ts`, put the Client ID from step 4.7 into `GOOGLE_CLIENT_ID` and the Web app URL from step 5.7 into `LOGIN_URL`. Neither is a secret.
2. Test locally first: `npm run dev`, open `http://localhost:5173`, click **Edit site** in the footer, pick an allowed account. You should come back to the same page with the edit bar at the bottom. Don't save here unless you mean it: saving from localhost commits to the real `main`.
3. Commit, open a PR, merge. After the deploy (about 2 minutes), do the same on https://fusiandance.github.io.
4. Try a small change and **Save**. A commit by `fusian-site-editor[bot]` should appear on `main`, followed by a deploy run in the Actions tab.

#### 7. Remove the old Google Form setup

If the Google Form and its response Sheet from the earlier form sync were created, delete them in Google Drive (signed in as their owner). The `SHEET_CSV_URL` repo variable was never set, so there is nothing to remove on GitHub. The old workflows are already deleted by this change.

### Changing things later

- **Add or remove an editor:** edit `ALLOWED_EMAILS` under Apps Script **Project Settings** → **Script Properties**. It applies to the next login, no redeploy needed. A removed person's current token keeps working for up to 1 hour.
- **New `Code.gs` version:** edit it in the Apps Script editor, save, then **Deploy** → **Manage deployments** → pencil icon → **Version: New version** → **Deploy**. This keeps the URL. "New deployment" would create a new URL instead.
- **New private key** (if the old one leaked): App settings → **Private keys** → generate a new one, put it into the `PRIVATE_KEY` script property (step 3), then delete the old key on GitHub.
- **Change App permissions:** App settings → **Permissions & events**. An org owner must then accept the new permissions under org **Settings** → **GitHub Apps** → **Configure**.
- **Another site address** (e.g. a custom domain): add it with a trailing slash to the OAuth client's **Authorized redirect URIs** (step 4.6).
- **Lock everyone out right away:** org **Settings** → **GitHub Apps** → **Configure** → **Suspend**. Tokens stop working immediately. Emptying `ALLOWED_EMAILS` stops new logins.

### Troubleshooting

Login errors show in the edit bar at the bottom of the site, or on a Google page.

| Symptom                                                                                               | Cause and fix                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google: "Error 400: redirect_uri_mismatch"                                                            | The site's address is not in the OAuth client's **Authorized redirect URIs** (step 4.6). It must match exactly, including `https://` and the trailing slash. After a change, wait a few minutes.                                                                                                                                                      |
| Google: "Error 401: invalid_client" or "The OAuth client was not found"                               | `GOOGLE_CLIENT_ID` in `src/lib/edit.ts` is wrong or still the placeholder.                                                                                                                                                                                                                                                                            |
| Google: "Access blocked: … has not completed the Google verification process" / "Error 403"           | The consent screen is still in Testing. Step 4.4: **Publish app**.                                                                                                                                                                                                                                                                                    |
| Edit bar: "… may not edit the website."                                                               | That Google account is not in `ALLOWED_EMAILS`. Add it, or click **Log in** and pick the allowed account in the picker.                                                                                                                                                                                                                               |
| Edit bar: "Google login failed, please try again."                                                    | The `CLIENT_ID` script property doesn't match `GOOGLE_CLIENT_ID` in `src/lib/edit.ts`, or the account's email isn't verified with Google.                                                                                                                                                                                                             |
| Edit bar: "Could not reach the login script. …"                                                       | `LOGIN_URL` is wrong, or the deployment's **Who has access** is not **Anyone** (step 5.5). Opening `LOGIN_URL` in a private window must show "Fusian edit login is running."                                                                                                                                                                          |
| Edit bar: "Login failed, please try again."                                                           | The login was finished in another tab than it started in, or someone sent you a login link. Click **Edit site** again.                                                                                                                                                                                                                                |
| Edit bar: "Login script error: You do not have permission to call UrlFetchApp.fetch"                  | `fusianmunich@gmail.com` didn't grant "Connect to an external service". Remove the access at [myaccount.google.com/connections](https://myaccount.google.com/connections) → **Fusian edit login** → **Delete all connections**, then redo step 5.6 by running `doGet` in the editor (function dropdown at the top → **Run**) and tick **Select all**. |
| Edit bar: "Login script error: …" mentioning `401` / "A JSON web token could not be decoded"          | `APP_ID` or `PRIVATE_KEY` is wrong. Check the App ID (not the Client ID), and that the key starts with `-----BEGIN PRIVATE KEY-----\n` (PKCS#8, one line).                                                                                                                                                                                            |
| Edit bar: "Login script error: Invalid argument: key"                                                 | The key is still PKCS#1 (`BEGIN RSA PRIVATE KEY`) or has real line breaks. Redo step 3.                                                                                                                                                                                                                                                               |
| Edit bar: "Login script error: …" mentioning `404`                                                    | Wrong `INSTALLATION_ID`, or the App is not installed on the repo.                                                                                                                                                                                                                                                                                     |
| Edit bar: "Login script error: …" mentioning `422` and "repositories"                                 | The App's installation doesn't include `FusianDance.github.io`. Org Settings → GitHub Apps → Configure → add the repo.                                                                                                                                                                                                                                |
| Save: "GitHub 403: Resource not accessible by integration"                                            | The App lacks **Contents: Read and write**, or the org hasn't accepted a permission change yet.                                                                                                                                                                                                                                                       |
| Save: "GitHub 422: … Protected branch update failed" or "Changes must be made through a pull request" | Step 2 is missing: the App may not bypass the pull request rule on `main`.                                                                                                                                                                                                                                                                            |

Apps Script logs every run under **Executions** (left sidebar) with the full error message.

### Notes

- The account picker lists every Google account signed in to the browser. Pick the one in `ALLOWED_EMAILS`; other accounts are turned away.
- If someone else saved the same file while you were editing, Save refuses. Cancel and redo your edits.
- Unsaved photos are kept in browser storage (about 5 MB). With many large photos, Save first and then add more.
- Local testing: `npm run dev`, then use **Edit site** on `http://localhost:5173`. Saving commits to the real `main`.

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
