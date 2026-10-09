import { EventsTimeline } from "@/components/events-timeline";
import type { Route } from "./+types/events";
import { announcements } from "@/lib/data.server";

export function loader() {
  return { announcements, buildTime: Date.now() };
}

export default function EventsPage({ loaderData }: Route.ComponentProps) {
  return <EventsTimeline announcements={loaderData.announcements} buildTime={loaderData.buildTime} />;
}
