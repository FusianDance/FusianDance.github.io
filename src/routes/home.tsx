import { PostCard } from "@/components/post.card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { UpcomingAnnouncements } from "@/components/upcoming-announcements";
import type { Route } from "./+types/home";
import { announcements, posts } from "@/lib/data.server";

export function loader() {
  return { announcements, posts, buildTime: Date.now() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { announcements, posts, buildTime } = loaderData;
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="my-10 text-center">
        <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
          Fusian Dance Crew
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Where passion meets rhythm. Join our dance crew and express yourself through the art of movement.
        </p>
      </section>

      {/* Instagram Section */}
      <section className="flex flex-row justify-center py-10">
        <Carousel
          className="w-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent className="m-3 flex items-center">
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
          <UpcomingAnnouncements announcements={announcements} buildTime={buildTime} />
        </div>
      </section>
    </div>
  );
}
