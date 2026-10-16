import { AboutEditor } from "@/components/edit/about-editor";
import { Markdown } from "@/components/markdown";
import type { Route } from "./+types/about";
import { about, contact } from "@/lib/data.server";
import { useDraft } from "@/lib/edit";

export function loader() {
  return { about, contact };
}

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const draft = useDraft();
  if (draft) return <AboutEditor draft={draft} />;
  const { about, contact } = loaderData;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Markdown text={about} />
        <div className="mt-8 flex flex-col">
          <div className="flex flex-wrap gap-4">
            <h3 className="mb-2 font-medium">Email</h3>
            <a href={`mailto:${contact.email}`} className="text-primary transition-colors hover:text-foreground">
              {contact.email}
            </a>
          </div>

          <div className="flex flex-wrap gap-4">
            <h3 className="mb-2 font-medium">Instagram</h3>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:text-foreground"
            >
              @fusiandance
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
