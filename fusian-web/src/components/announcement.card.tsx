import { Announcement } from "@/lib/models/announcement";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card key={announcement.id} className="hover:shadow-md transition-shadow hover:scale-102">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-x-2 items-center">
              <h3 className="font-semibold text-xl truncate">{announcement.title}</h3>
              {announcement.timestamp < new Date() && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Past</span>
              )}
              {announcement.timestamp >= new Date() && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Upcoming</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {new Date(announcement.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          <p className="text-muted-foreground text-sm">{announcement.content}</p>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
