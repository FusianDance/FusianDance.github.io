import { lazy, Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { audition } from "@/lib/data.server";
import { useEditDraft, useLiveContent } from "@/lib/edit/session";
import { seo } from "@/lib/seo";

// No ./+types/audition: typegen only knows this route while it is enabled (data/pages.yml).
export const meta = () => seo("/audition/", "Audition", "Apply for the next Fusian Dance Crew audition in Munich.");

// The editor (CodeMirror) only loads in edit mode, visitors don't download it.
const MarkdownEditor = lazy(() =>
  import("@/components/edit/markdown-editor").then((m) => ({ default: m.MarkdownEditor })),
);

export function loader() {
  return { audition };
}

export default function AuditionPage({ loaderData }: { loaderData: ReturnType<typeof loader> }) {
  const { audition, uploads } = useLiveContent(loaderData);
  const editDraft = useEditDraft();
  if (editDraft) {
    return (
      <Suspense>
        <MarkdownEditor draft={editDraft} field="audition" />
      </Suspense>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Markdown text={audition} images={uploads} />
      </div>
    </div>
  );
}
