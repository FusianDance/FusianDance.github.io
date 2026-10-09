import type { Announcement } from "@/lib/models/announcement";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

              <div className="text-sm whitespace-nowrap text-muted-foreground">
                {announcement.timestamp.toLocaleDateString("en-US", {
                  timeZone: "Europe/Berlin",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
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
