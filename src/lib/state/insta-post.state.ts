import { create } from "zustand";
import { InstaPost } from "../models/insta-post";

type PostStore = {
  posts: InstaPost[];
};

type InstaPostConfigEntry = {
  html: string;
};

async function loadPostsFromCSV(): Promise<InstaPost[]> {
  // Skip loading on server side
  if (typeof window === "undefined") {
    return [];
  }

  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, ""); // no trailing slash
  const url = `${base}/insta-posts.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load insta-posts.csv: ${res.statusText}`);
  }
  const data = (await res.json()) as InstaPostConfigEntry[];

  let count = 0;
  const posts = data.map((entry) => ({
    id: String(count++),
    html: entry.html,
  }));
  return posts;
}

export const usePostStore = create<PostStore>((set) => {
  const initialState: PostStore = {
    posts: [],
  };

  // Load posts from CSV
  loadPostsFromCSV().then((posts) => {
    set({ posts });
  });

  return initialState;
});
