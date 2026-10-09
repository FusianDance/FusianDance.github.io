import { Link } from "react-router";
import { type NavItem, NavItems } from "@/lib/models/nav-item";
import type { Contact } from "@/lib/models/contact";
import { FusianIcon } from "@/components/fusian.icon";

export function Footer({ contact }: { contact: Contact }) {
  return (
    <footer className="border-t bg-background">
      <div className="flex w-full flex-row flex-wrap gap-8 px-4 py-8 md:justify-around">
        {/* Brand Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <FusianIcon className="h-8 w-8 fill-primary" />
            <span className="text-lg font-bold">Fusian</span>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Fusian Dance Crew - Where passion meets rhythm. Join us in expressing art through movement.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Quick Links</h3>
          <ul className="grid grid-cols-1 space-y-2 gap-x-4 text-sm sm:grid-cols-2">
            {NavItems.map((item: NavItem) => (
              <li key={item.appRoute}>
                <Link to={item.appRoute} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.navTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Connect</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {`Instagram: @fusiandance`}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {`Email: ${contact.email}`}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
