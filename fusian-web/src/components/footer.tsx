import { NavItem } from "@/lib/models/nav-item";
import { contact } from "@/lib/state/contact";
import Link from "next/link";
import { GetNavItems } from "@/lib/models/nav-item";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="w-full py-8 px-4 flex flex-row flex-wrap gap-8 md:justify-around">
        {/* Brand Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80"></div>
            <span className="font-bold text-lg">Fusian</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Fusian Dance Crew - Where passion meets rhythm. Join us in expressing art through movement.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Quick Links</h3>
          <ul className="space-y-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {GetNavItems().map((item: NavItem) => (
              <li key={item.appRoute}>
                <Link
                  href={item.appRoute}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.navTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Connect</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {`Instagram: @fusiandance`}
              </Link>
            </li>
            <li>
              <Link
                href={`mailto:${contact.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {`Email: ${contact.email}`}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
