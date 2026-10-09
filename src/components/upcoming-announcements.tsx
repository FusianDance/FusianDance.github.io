import { AnnouncementCard } from "@/components/announcement.card";
import type { Announcement } from "@/lib/models/announcement";
import { todayIndex, useNow } from "@/lib/hooks/use-now";

export function UpcomingAnnouncements({
  announcements,
  buildTime,
}: {
  announcements: Announcement[];
  buildTime: number;
}) {
  const now = useNow(buildTime);
  const today = todayIndex(announcements, now);

  // Show only the 3 announcements nearest to today
  return announcements
    .slice(Math.max(0, today - 3), today)
    .reverse()
    .map((a) => <AnnouncementCard key={a.id} announcement={a} upcoming />);
}
