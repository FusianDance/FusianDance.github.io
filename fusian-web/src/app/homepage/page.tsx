"use client";

import { AnnouncementCard } from "@/components/announcement.card";
import { PostCard } from "@/components/post.card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAnnouncementStore } from "@/lib/state/announcement.state";
import { usePostStore } from "@/lib/state/insta-post.state";

export default function Homepage() {
  const { posts } = usePostStore();
  const { announcements, todayIndex } = useAnnouncementStore();

  // Show only the first 3 announcements
  const startIndex = Math.max(0, todayIndex - 3);
  const displayedAnnouncements = announcements.slice(startIndex, todayIndex).reverse();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="my-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-6">
          Fusian Dance Crew
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Where passion meets rhythm. Join our dance crew and express yourself through the art of movement.
        </p>
      </section>

      {/* Instagram Section */}
      <section className="flex flex-row py-10 justify-center">
        <Carousel className="w-full">
          <CarouselContent className="flex m-3 items-center">
            {posts?.map((post) => (
              <div key={post.id}>
                <CarouselItem>
                  <PostCard post={post}></PostCard>
                </CarouselItem>
              </div>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>

      {/* Announcement Section */}
      <section className="my-10">
        <div className="flex flex-col gap-y-2">
          {displayedAnnouncements.map((announcement) => AnnouncementCard({ announcement: announcement }))}
        </div>
      </section>
    </div>
  );
}
