"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { NavItems } from "@/lib/models/nav-item";
import { NavItem } from "@/lib/models/nav-item";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close mobile menu when pathname changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-x-1">
              <FusianIcon className="fill-primary w-8 h-8"/>
              <span className="hidden font-bold sm:inline-block text-xl">Fusian</span>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {NavItems.map((item: NavItem) => (
                <NavigationMenuItem key={item.appRoute}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === item.appRoute ? "bg-accent text-accent-foreground" : "text-foreground"
                    )}
                  >
                    <Link href={item.appRoute}>{item.navTitle}</Link>
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col p-2 border-t">
              {NavItems.map((item: NavItem) => (
                <Link
                  key={item.appRoute}
                  href={item.appRoute}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.appRoute
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
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
