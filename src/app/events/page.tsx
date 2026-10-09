import { EventsTimeline } from "@/components/events-timeline";
import { announcements } from "@/lib/data";

export default function EventsPage() {
  return <EventsTimeline announcements={announcements} buildTime={Date.now()} />;
}
