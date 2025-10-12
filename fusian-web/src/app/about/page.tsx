import { contact } from "@/lib/state/contact";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Fusian Dance Crew</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Founded in 2017, Fusian Dance Crew has become a leading force in the local dance community,
            bringing together passionate dancers from all backgrounds and skill levels.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">Our Mission</h2>
          <p className="mb-6">
            To create a welcoming space where dancers can express themselves, grow their skills, and connect
            with others who share their passion for movement and music.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">What We Do</h2>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Weekly dance classes in various styles</li>
            <li>Performance opportunities at local events</li>
            <li>Workshops with guest choreographers</li>
            <li>Community outreach programs</li>
            <li>Annual showcases and competitions</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4 mt-8">Join Us</h2>
          <p>
            Whether you&apos;re a beginner taking your first steps or an experienced dancer looking for a new
            creative home, Fusian welcomes you. Come dance with us!
          </p>
          <div className="flex flex-col mt-8">
            <div className="flex flex-wrap gap-4">
              <h3 className="font-medium mb-2">Email</h3>
              <Link
                href={`mailto:${contact.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {contact.email}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              <h3 className="font-medium mb-2">Instagram</h3>
              <Link
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                @fusiandance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
