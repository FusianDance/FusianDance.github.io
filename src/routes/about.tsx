import { lazy, Suspense } from "react";
import { Markdown } from "@/components/markdown";
import type { Route } from "./+types/about";
import { about, contact } from "@/lib/data.server";
import { useDraft, useEditDraft } from "@/lib/edit/session";
import { seo } from "@/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo(
    "/about/",
    "About",
    "About Fusian Dance Crew, a dance crew in Munich founded in 2017: our mission, what we do, and how to join.",
  );

// The editor (CodeMirror) only loads in edit mode, visitors don't download it.
const MarkdownEditor = lazy(() =>
  import("@/components/edit/markdown-editor").then((m) => ({ default: m.MarkdownEditor })),
);

export function loader() {
  return { about, contact };
}

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const draft = useDraft();
  const editDraft = useEditDraft();
  if (editDraft) {
    return (
      <Suspense>
        <MarkdownEditor draft={editDraft} field="about" />
      </Suspense>
    );
  }
  const about = draft?.about ?? loaderData.about;
  const contact = draft?.contact ?? loaderData.contact;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Markdown text={about} images={draft?.uploads} />
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
