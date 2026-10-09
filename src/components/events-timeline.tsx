import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/models/announcement";
import { todayIndex, useNow } from "@/lib/hooks/use-now";
import { useState } from "react";
import { ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { AnnouncementCard } from "@/components/announcement.card";

export function EventsTimeline({ announcements, buildTime }: { announcements: Announcement[]; buildTime: number }) {
  const shownEvents = 3;
  const now = useNow(buildTime);
  const today = todayIndex(announcements, now);
  const [pastEventsCount, setPastEventsCount] = useState(shownEvents);
  const [futureEventsCount, setFutureEventsCount] = useState(shownEvents);

  // Separate past and future events
  const pastEvents = announcements.slice(today);
  const futureEvents = announcements.slice(0, today);

  // Determine how many events to show
  const pastEventsToShow = pastEvents.slice(0, pastEventsCount);
  const futureEventsToShow = futureEvents.slice(-futureEventsCount);

  const handleShowMoreFuture = () => {
    setFutureEventsCount((prev) => Math.min(prev + shownEvents, futureEvents.length));
  };

  const handleShowLessFuture = () => {
    setFutureEventsCount(shownEvents);
  };

  const handleShowMorePast = () => {
    setPastEventsCount((prev) => Math.min(prev + shownEvents, pastEvents.length));
  };

  const handleShowLessPast = () => {
    setPastEventsCount(shownEvents);
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Events & Announcements</h1>

        {/* View More Future Events Button */}
        {futureEvents.length > futureEventsCount && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={handleShowMoreFuture} className="flex items-center gap-2">
              <ChevronUp className="h-4 w-4" />
              {`View ${Math.min(3, futureEvents.length - futureEventsCount)} More Future Events`}
            </Button>
          </div>
        )}

        {/* Show Less Future Events Button */}
        {futureEventsCount > shownEvents && !(futureEvents.length > futureEventsCount) && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={handleShowLessFuture} className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              Show Less Future Events
            </Button>
          </div>
        )}

        {/* Future Events */}
        {futureEventsToShow.length > 0 && (
          <div className="mb-8 space-y-4">
            {futureEventsToShow.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} upcoming />
            ))}
          </div>
        )}

        {/* Today Divider */}
        <div className="my-8 flex items-center">
          <div className="h-px flex-1 bg-primary"></div>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Today -{" "}
              {new Date(now).toLocaleDateString("en-US", {
                timeZone: "Europe/Berlin",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="h-px flex-1 bg-primary"></div>
        </div>

        {/* Past Events */}
        {pastEventsToShow.length > 0 && (
          <div className="mb-8 space-y-4">
            {pastEventsToShow.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} upcoming={false} />
            ))}
          </div>
        )}

        {/* View More Past Events Button */}
        {pastEvents.length > pastEventsCount && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={handleShowMorePast} className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              {`View ${Math.min(3, pastEvents.length - pastEventsCount)} More Past Events`}
            </Button>
          </div>
        )}

        {/* Show Less Past Events Button */}
        {pastEventsCount > shownEvents && !(pastEvents.length > pastEventsCount) && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleShowLessPast} className="flex items-center gap-2">
              <ChevronUp className="h-4 w-4" />
              Show Less Past Events
            </Button>
          </div>
        )}

        {/* Empty State */}
        {pastEvents.length === 0 && futureEvents.length === 0 && (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground">Check back soon for upcoming events and announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
}
