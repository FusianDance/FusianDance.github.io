import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { PostCard } from "@/components/post.card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postUrl, type PostEntry } from "@/lib/content";
import { updateDraft, type Draft } from "@/lib/edit";

const setPosts = (fn: (list: PostEntry[]) => PostEntry[]) => updateDraft((d) => ({ ...d, posts: fn(d.posts) }));

const swap = (i: number, j: number) =>
  setPosts((list) => list.map((entry, k) => (k === i ? list[j] : k === j ? list[i] : entry)));

export function PostsEditor({ draft }: { draft: Draft }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const url = postUrl(value);
    if (!url) return setError("That's not a link to an Instagram post or reel.");
    if (draft.posts.some((p) => p.url === url)) return setError("That post is already in the gallery.");
    setPosts((list) => [{ url }, ...list]);
    setValue("");
  };

  return (
    <div className="container mx-auto justify-center px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">Gallery</h1>
      <form onSubmit={add} className="mb-2 flex max-w-xl gap-2">
        <Input
          placeholder="https://www.instagram.com/p/…"
          aria-label="Instagram post link"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        <Button type="submit">
          <Plus />
          Add post
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="mb-8 text-sm text-muted-foreground">The order here is the order on the site: first = newest.</p>
      <div className="flex flex-col flex-wrap gap-4 lg:flex-row">
        {draft.posts.map((entry, i) => (
          <div key={entry.url}>
            <div className="mb-2 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Move earlier"
                disabled={i === 0}
                onClick={() => swap(i, i - 1)}
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Move later"
                disabled={i === draft.posts.length - 1}
                onClick={() => swap(i, i + 1)}
              >
                <ArrowRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove post"
                onClick={() => setPosts((list) => list.filter((_, k) => k !== i))}
              >
                <Trash2 />
              </Button>
            </div>
            <PostCard post={{ id: entry.url, url: entry.url }} />
          </div>
        ))}
      </div>
    </div>
  );
}
