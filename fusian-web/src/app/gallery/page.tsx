"use client";

import { PostCard } from "@/components/post.card";
import { usePostStore } from "@/lib/state/insta-post.state";

export default function GalleryPage() {
  const { posts } = usePostStore();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full mx-auto">
        <h1 className="text-4xl font-bold mb-8">Gallery</h1>
        <div className="flex flex-wrap gap-4">
          {posts?.map((post) => (
            <div key={post.id}>
              <PostCard post={post}></PostCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
