import { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

  // Your Google Form ID - extract from the embed URL between /e/ and /viewform
  const FORM_ID = "1FAIpQLSdJkF7r42bPm_wQUzWIGHB9-jL5-BUvrdT2e6-Ss9p6me2yLQ";
  const formUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Markdown text={audition} images={uploads} />
        </div>

        {/* Google Form Embed */}
        <Card className="w-full">
          <CardContent>
            <div className="relative h-[90vh] w-full">
              <iframe
                src={formUrl + "?embedded=true"}
                width="100%"
                height="100%"
                title="Fusian Dance Audition Application"
                className="rounded-lg"
                loading="lazy"
              >
                Loading form...
              </iframe>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 rounded-lg bg-secondary p-4">
          <p className="text-sm text-muted-foreground">
            Having trouble with the form?
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:text-foreground"
            >
              Open in a new window
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
