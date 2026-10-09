export type NavItem = {
  navTitle: string;
  appRoute: string;
};

// Flagged entries must match the flagged routes in src/routes.ts.
export const NavItems: NavItem[] = [
  { navTitle: "Home", appRoute: "/" },
  { navTitle: "About", appRoute: "/about" },
  { navTitle: "Events", appRoute: "/events" },
  { navTitle: "Gallery", appRoute: "/gallery" },
  ...(import.meta.env.FEATURE_AUDITION === "true" ? [{ navTitle: "Audition", appRoute: "/audition" }] : []),
];
