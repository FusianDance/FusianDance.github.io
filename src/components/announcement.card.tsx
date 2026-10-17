import type { Announcement } from "@/lib/models/announcement";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

const dateFormat = { timeZone: "Europe/Berlin", year: "numeric", month: "long", day: "numeric" } as const;
const dayFormat = new Intl.DateTimeFormat("en-US", dateFormat);
const timeFormat = new Intl.DateTimeFormat("en-US", { ...dateFormat, hour: "numeric", minute: "2-digit" });

/** "March 12 – 14, 2026", "March 12, 2026, 7:00 – 9:00 PM", ... */
export const when = (a: Announcement) => (a.allDay ? dayFormat : timeFormat).formatRange(a.start, a.end ?? a.start);

export function AnnouncementCard({ announcement, upcoming }: { announcement: Announcement; upcoming: boolean }) {
  return (
    <Card key={announcement.id} className="transition-shadow hover:scale-102 hover:shadow-md">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold break-normal">{announcement.title}</h3>
            <div className="flex flex-1 flex-row items-center justify-between gap-2">
              {upcoming ? (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Upcoming</span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Past</span>
              )}

              <div className="text-right text-sm text-muted-foreground">{when(announcement)}</div>
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          <p className="text-sm break-normal text-muted-foreground">{announcement.content}</p>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
