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
import { Toggle } from "@/components/ui/toggle";
import { Tip } from "@/components/edit/tip";
import { FusianIcon } from "@/components/fusian.icon";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { FlaggedPages, NavItems, type NavItem } from "@/lib/models/nav-item";
import { updateDraft, useEditDraft } from "@/lib/edit";

// Edit-only page, in the nav while editing.
const EDIT_ITEMS: NavItem[] = [{ navTitle: "Contact", appRoute: "/edit/contact" }];

type Item = NavItem & { key?: string };

/** Turns a flagged page on or off in the draft; the deploy after Save builds or drops it. */
function PageToggle({ item, on, className }: { item: Item; on: boolean; className: string }) {
  return (
    <Tip label={`${item.navTitle} page online (after Save and deploy)`}>
      <Toggle
        variant="outline"
        className={cn("size-6 min-w-6 bg-background px-0 [&_svg:not([class*='size-'])]:size-3.5", className)}
        pressed={on}
        onPressedChange={(pressed) => updateDraft((d) => ({ ...d, pages: { ...d.pages, [item.key!]: pressed } }))}
      >
        {on ? <Eye /> : <EyeOff />}
      </Toggle>
    </Tip>
  );
}

/** pages: keys of the flagged pages in this build. While editing, all flagged pages show, each with an on/off button;
 * ones not built yet aren't links. */
export function Navbar({ pages }: { pages: string[] }) {
  const pathname = useLocation().pathname.replace(/(.)\/$/, "$1");
  // The mobile menu remembers the page it was opened on, so it closes on navigation.
  const [menuOpenedAt, setMenuOpenedAt] = React.useState<string | null>(null);
  const isMobileMenuOpen = menuOpenedAt === pathname;
  const draft = useEditDraft();
  const items: Item[] = draft
    ? [...NavItems, ...FlaggedPages, ...EDIT_ITEMS]
    : [...NavItems, ...FlaggedPages.filter((page) => pages.includes(page.key))];
  const built = (item: Item) => !item.key || pages.includes(item.key);
  const on = (item: Item) => !item.key || !draft || !!draft.pages[item.key];

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
              {items.map((item) => (
                <NavigationMenuItem key={item.appRoute} className="relative">
                  {built(item) ? (
                    <NavigationMenuLink
                      render={<Link to={item.appRoute} />}
                      className={cn(
                        "inline-flex px-4 py-2 text-sm font-medium",
                        pathname === item.appRoute ? "bg-accent text-accent-foreground" : "text-foreground",
                        !on(item) && "text-muted-foreground",
                      )}
                    >
                      {item.navTitle}
                    </NavigationMenuLink>
                  ) : (
                    <span className="inline-flex px-4 py-2 text-sm font-medium text-muted-foreground">
                      {item.navTitle}
                    </span>
                  )}
                  {draft && item.key && (
                    <PageToggle item={item} on={on(item)} className="absolute -top-2.5 -right-2.5" />
                  )}
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
              {items.map((item) => (
                <div key={item.appRoute} className="relative">
                  {built(item) ? (
                    <Link
                      to={item.appRoute}
                      className={cn(
                        "block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === item.appRoute
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50",
                        !on(item) && "text-muted-foreground",
                      )}
                      onClick={() => setMenuOpenedAt(null)}
                    >
                      {item.navTitle}
                    </Link>
                  ) : (
                    <span className="block px-3 py-2 text-base font-medium text-muted-foreground">{item.navTitle}</span>
                  )}
                  {draft && item.key && (
                    <PageToggle item={item} on={on(item)} className="absolute top-1/2 right-3 -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
