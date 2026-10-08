export type NavItem = {
  navTitle: string;
  appRoute: string;
};

const requiredNavItems: NavItem[] = [
  {
    navTitle: "Home",
    appRoute: "/",
  },
  {
    navTitle: "About",
    appRoute: "/about",
  },
  {
    navTitle: "Events",
    appRoute: "/events",
  },
  {
    navTitle: "Gallery",
    appRoute: "/gallery",
  },
];

export let NavItems: NavItem[]
try {
      const { additionalNavItems } = await import('../../config/nav-items.generated');
      NavItems = [...requiredNavItems, ...additionalNavItems];
} catch (error) {
      console.error('Error loading additional nav items:', error);
      NavItems = [...requiredNavItems];
}
