import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { berlinIso, berlinLocal, type AnnouncementEntry } from "@/lib/content";
import { updateDraft, type Draft } from "@/lib/edit";

const setAnnouncements = (fn: (list: AnnouncementEntry[]) => AnnouncementEntry[]) =>
  updateDraft((d) => ({ ...d, announcements: fn(d.announcements) }));

const patch = (i: number, change: Partial<AnnouncementEntry>) =>
  setAnnouncements((list) => list.map((entry, j) => (j === i ? { ...entry, ...change } : entry)));

export function AnnouncementsEditor({ draft }: { draft: Draft }) {
  const add = () =>
    setAnnouncements((list) => [
      ...list,
      { title: "", content: "", date: berlinIso(berlinLocal(new Date().toISOString()))! },
    ]);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">Events & Announcements</h1>
          <Button onClick={add}>
            <Plus />
            Add event
          </Button>
        </div>

        <div className="space-y-4">
          {draft.announcements
            .map((entry, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="h-auto min-w-48 flex-1 text-xl font-semibold md:text-xl"
                      placeholder="Title"
                      aria-label="Title"
                      aria-invalid={!entry.title.trim()}
                      autoFocus={!entry.title}
                      value={entry.title}
                      onChange={(e) => patch(i, { title: e.target.value })}
                    />
                    <Input
                      type="datetime-local"
                      className="w-auto"
                      aria-label="Date and time (Munich)"
                      value={berlinLocal(entry.date)}
                      onChange={(e) => {
                        const iso = berlinIso(e.target.value);
                        if (iso) patch(i, { date: iso });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete event"
                      onClick={() => setAnnouncements((list) => list.filter((_, j) => j !== i))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Text"
                    aria-label="Text"
                    aria-invalid={!entry.content.trim()}
                    value={entry.content}
                    onChange={(e) => patch(i, { content: e.target.value })}
                  />
                </CardHeader>
              </Card>
            ))
            .reverse()}
        </div>

        {draft.announcements.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground">No events yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
