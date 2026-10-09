import { Alert, AlertTitle } from "@/components/ui/alert";
import type { Route } from "./+types/about";
import { contact } from "@/lib/data.server";
import { AlertCircleIcon } from "lucide-react";

export function loader() {
  return { contact };
}

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { contact } = loaderData;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">About Fusian Dance Crew</h1>

        <div className="prose prose-lg max-w-none">
          <p className="mb-6 text-lg text-muted-foreground">
            Founded in 2017, Fusian Dance Crew has become a leading force in the local dance community, bringing
            together passionate dancers from all backgrounds and skill levels.
          </p>

          <h2 className="mt-8 mb-4 text-2xl font-semibold">Our Mission</h2>
          <p className="mb-6">
            To create a welcoming space where dancers can express themselves, grow their skills, and connect with others
            who share their passion for movement and music.
          </p>

          <h2 className="mt-8 mb-4 text-2xl font-semibold">What We Do</h2>
          <ul className="mb-6 list-inside list-disc space-y-2">
            <li>Weekly dance classes in various styles</li>
            <li>Performance opportunities at local events</li>
            <li>Workshops with guest choreographers</li>
            <li>Community outreach programs</li>
            <li>Annual showcases</li>
          </ul>

          <h2 className="mt-8 mb-4 text-2xl font-semibold">Join Us</h2>
          <p>
            Whether you&apos;re a beginner taking your first steps or an experienced dancer looking for a new creative
            home, Fusian welcomes you. Come dance with us and join our Audition! <br />
            <Alert variant="destructive" className="mt-4">
              <AlertTitle className="flex items-center gap-2">
                <AlertCircleIcon />
                <span className="text-lg">
                  The next audition cycle will be announced at the start of next semester (Sommersemester 26).
                </span>
              </AlertTitle>
            </Alert>
            <span className="mt-4 block text-muted-foreground"></span>
          </p>
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
    </div>
  );
}
