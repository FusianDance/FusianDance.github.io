import * as React from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { FusianIcon } from "@/components/fusian.icon";
import { Menu, X } from "lucide-react";
import { NavItems, type NavItem } from "@/lib/models/nav-item";

export function Navbar() {
  const pathname = useLocation().pathname.replace(/(.)\/$/, "$1");
  // The mobile menu remembers the page it was opened on, so it closes on navigation.
  const [menuOpenedAt, setMenuOpenedAt] = React.useState<string | null>(null);
  const isMobileMenuOpen = menuOpenedAt === pathname;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-x-1">
              <FusianIcon className="h-8 w-8 fill-primary" />
              <span className="hidden text-xl font-bold sm:inline-block">Fusian</span>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {NavItems.map((item: NavItem) => (
                <NavigationMenuItem key={item.appRoute}>
                  <NavigationMenuLink
                    render={<Link to={item.appRoute} />}
                    className={cn(
                      "inline-flex px-4 py-2 text-sm font-medium",
                      pathname === item.appRoute ? "bg-accent text-accent-foreground" : "text-foreground",
                    )}
                  >
                    {item.navTitle}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpenedAt(isMobileMenuOpen ? null : pathname)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col border-t p-2">
              {NavItems.map((item: NavItem) => (
                <Link
                  key={item.appRoute}
                  to={item.appRoute}
                  className={cn(
                    "block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.appRoute
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50",
                  )}
                  onClick={() => setMenuOpenedAt(null)}
                >
                  {item.navTitle}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
