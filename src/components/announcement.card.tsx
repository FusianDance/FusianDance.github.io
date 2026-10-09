import { Announcement } from "@/lib/models/announcement";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AnnouncementCard({ announcement, upcoming }: { announcement: Announcement; upcoming: boolean }) {
  return (
    <Card key={announcement.id} className="hover:shadow-md transition-shadow hover:scale-102">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row gap-2 items-center flex-wrap">
            <h3 className="font-semibold text-xl break-normal">{announcement.title}</h3>
            <div className="flex-1 flex flex-row gap-2 justify-between items-center">
              {upcoming ? (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Upcoming</span>
              ) : (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Past</span>
              )}

              <div className="text-sm text-muted-foreground whitespace-nowrap">
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
          <p className="text-muted-foreground text-sm break-normal">{announcement.content}</p>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
