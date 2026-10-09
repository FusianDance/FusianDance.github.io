import { PostCard } from "@/components/post.card";
import type { Route } from "./+types/gallery";
import { posts } from "@/lib/data.server";

export function loader() {
  return { posts };
}

export default function GalleryPage({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;
  return (
    <div className="container mx-auto justify-center px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">Gallery</h1>
      <div className="flex flex-col flex-wrap gap-4 lg:flex-row">
        {posts?.map((post) => (
          <div key={post.id}>
            <PostCard post={post}></PostCard>
          </div>
        ))}
      </div>
    </div>
  );
}
