import { EventsTimeline } from "@/components/events-timeline";
import type { Route } from "./+types/events";
import { announcements } from "@/lib/data.server";
import { useEditDraft, useLiveContent } from "@/lib/edit/session";
import { AnnouncementsEditor } from "@/components/edit/announcements-editor";
import { seo } from "@/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo("/events/", "Events", "Upcoming and past events of Fusian Dance Crew in Munich, with dates and details.");

export function loader() {
  return { announcements, buildTime: Date.now() };
}

export default function EventsPage({ loaderData }: Route.ComponentProps) {
  const editDraft = useEditDraft();
  const { announcements } = useLiveContent(loaderData);
  if (editDraft) return <AnnouncementsEditor draft={editDraft} />;
  return <EventsTimeline announcements={announcements} buildTime={loaderData.buildTime} />;
}
