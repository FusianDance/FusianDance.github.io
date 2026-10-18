export type NavItem = {
  navTitle: string;
  appRoute: string;
};

export const NavItems: NavItem[] = [
  { navTitle: "Home", appRoute: "/" },
  { navTitle: "About", appRoute: "/about" },
  { navTitle: "Events", appRoute: "/events" },
  { navTitle: "Gallery", appRoute: "/gallery" },
];

/** Pages switched on and off in data/pages.yml (by key). src/routes.ts only adds the enabled ones,
 * so a disabled page isn't built at all. No imports: src/routes.ts and plain node load this too. */
export const FlaggedPages: (NavItem & { key: string; file: string })[] = [
  { key: "audition", navTitle: "Audition", appRoute: "/audition", file: "routes/audition.tsx" },
];
