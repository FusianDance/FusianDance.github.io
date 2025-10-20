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

let navItems: NavItem[] | undefined = undefined;

export function GetNavItems(): NavItem[] {
  if (navItems == undefined) {
    // TODO initialize navItems from json file

    navItems = requiredNavItems;
  }

  return navItems;
}
