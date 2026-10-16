import { EventsTimeline } from "@/components/events-timeline";
import type { Route } from "./+types/events";
import { announcements } from "@/lib/data.server";
import { useDraft } from "@/lib/edit";
import { AnnouncementsEditor } from "@/components/edit/announcements-editor";

export function loader() {
  return { announcements, buildTime: Date.now() };
}

export default function EventsPage({ loaderData }: Route.ComponentProps) {
  const draft = useDraft();
  if (draft) return <AnnouncementsEditor draft={draft} />;
  return <EventsTimeline announcements={loaderData.announcements} buildTime={loaderData.buildTime} />;
}
