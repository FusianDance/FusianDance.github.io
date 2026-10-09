"use client";

import { Button } from "@/components/ui/button";
import { Announcement } from "@/lib/models/announcement";
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Events & Announcements</h1>

        {/* View More Future Events Button */}
        {futureEvents.length > futureEventsCount && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={handleShowMoreFuture} className="flex items-center gap-2">
              <ChevronUp className="w-4 h-4" />
              {`View ${Math.min(3, futureEvents.length - futureEventsCount)} More Future Events`}
            </Button>
          </div>
        )}

        {/* Show Less Future Events Button */}
        {futureEventsCount > shownEvents && !(futureEvents.length > futureEventsCount) && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={handleShowLessFuture} className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              Show Less Future Events
            </Button>
          </div>
        )}

        {/* Future Events */}
        {futureEventsToShow.length > 0 && (
          <div className="space-y-4 mb-8">
            {futureEventsToShow.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} upcoming />
            ))}
          </div>
        )}

        {/* Today Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-primary"></div>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="w-4 h-4 text-primary" />
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
          <div className="flex-1 h-px bg-primary"></div>
        </div>

        {/* Past Events */}
        {pastEventsToShow.length > 0 && (
          <div className="space-y-4 mb-8">
            {pastEventsToShow.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} upcoming={false} />
            ))}
          </div>
        )}

        {/* View More Past Events Button */}
        {pastEvents.length > pastEventsCount && (
          <div className="flex justify-center mb-6">
            <Button variant="outline" onClick={handleShowMorePast} className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              {`View ${Math.min(3, pastEvents.length - pastEventsCount)} More Past Events`}
            </Button>
          </div>
        )}

        {/* Show Less Past Events Button */}
        {pastEventsCount > shownEvents && !(pastEvents.length > pastEventsCount) && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleShowLessPast} className="flex items-center gap-2">
              <ChevronUp className="w-4 h-4" />
              Show Less Past Events
            </Button>
          </div>
        )}

        {/* Empty State */}
        {pastEvents.length === 0 && futureEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground">Check back soon for upcoming events and announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
}
