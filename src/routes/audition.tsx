import { Card, CardContent } from "@/components/ui/card";

export default function AuditionPage() {
  // Your Google Form ID - extract from the embed URL between /e/ and /viewform
  const FORM_ID = "1FAIpQLSdJkF7r42bPm_wQUzWIGHB9-jL5-BUvrdT2e6-Ss9p6me2yLQ";
  const formUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Audition Application</h1>
        <p className="mb-8 text-muted-foreground">
          Fill out the form below to apply for our upcoming auditions. We&apos;re excited to see what you bring to the
          stage!
        </p>

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
