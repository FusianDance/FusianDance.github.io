import { Markdown } from "@/components/markdown";
import type { Route } from "./+types/privacy";
import { privacy } from "@/lib/data.server";
import { seo } from "@/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo("/privacy/", "Privacy Policy", "How the Fusian Dance Crew website handles your data.");

export function loader() {
  return { privacy };
}

export default function PrivacyPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Markdown text={loaderData.privacy} />
      </div>
    </div>
  );
}
