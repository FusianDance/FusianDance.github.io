# Fusian Dance Crew Website

**[https://fusiandance.github.io/fusian/](https://fusiandance.github.io/fusian/)**

A modern Next.js website for Fusian Dance Crew built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/fusian.git
cd fusian/fusian-web
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
- **State Management**: Zustand
- **Icons**: Lucide React
- **Theme**: next-themes

## 📦 Project Structure

```
fusian-web/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utilities and configurations
│       ├── models/         # TypeScript type definitions
│       ├── state/          # Zustand store definitions
│       └── utils.ts        # Utility functions
├── public/                 # Static assets
└── .github/workflows/      # GitHub Actions workflows
```

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
- **Announcements**: Hardcoded announcement system with Zustand state
- **Contact Form**: Static contact page with studio information
- **Type Safety**: Full TypeScript implementation

## 📝 Content Management

### Adding Announcements
Edit `src/lib/state/announcement.state.ts` to add new announcements:

```typescript
{
  id: "unique-id",
  title: "Your Title",
  content: "Your content here...",
  timestamp: new Date("2025-01-01"),
}
```

### Updating Contact Information
Edit `src/lib/state/contact.ts` to update contact details and training hours.

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