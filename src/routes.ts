import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Flagged routes only exist when FEATURE_<KEY>=true, so disabled pages are neither prerendered nor deployed.
// Keep in sync with NavItems in src/lib/models/nav-item.ts.
export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("events", "routes/events.tsx"),
  route("gallery", "routes/gallery.tsx"),
  ...(process.env.FEATURE_AUDITION === "true" ? [route("audition", "routes/audition.tsx")] : []),
] satisfies RouteConfig;
