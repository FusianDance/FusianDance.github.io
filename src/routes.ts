import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { pages } from "./lib/data.server";
import { FlaggedPages } from "./lib/models/nav-item";

// Flagged routes only exist when enabled in data/pages.yml (or FEATURES), so disabled pages are neither
// prerendered nor deployed.
export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("events", "routes/events.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("edit/contact", "routes/edit-contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  ...FlaggedPages.filter((page) => pages.includes(page.key)).map((page) => route(page.appRoute.slice(1), page.file)),
] satisfies RouteConfig;
