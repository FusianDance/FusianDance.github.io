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

/** Value for <input type="date"> or "datetime-local". */
const fmt = (iso: string, allDay?: boolean) => berlinLocal(iso).slice(0, allDay ? 10 : 16);

export function AnnouncementsEditor({ draft }: { draft: Draft }) {
  const add = () =>
    setAnnouncements((list) => [
      ...list,
      { title: "", content: "", startDate: berlinIso(berlinLocal(new Date().toISOString()))! },
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete event"
                      onClick={() => setAnnouncements((list) => list.filter((_, j) => j !== i))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type={entry.allDay ? "date" : "datetime-local"}
                      className="w-auto"
                      aria-label="Start (Munich)"
                      value={fmt(entry.startDate, entry.allDay)}
                      onChange={(e) => {
                        const iso = berlinIso(e.target.value);
                        if (!iso) return;
                        patch(i, {
                          startDate: iso,
                          ...(entry.endDate && Date.parse(entry.endDate) < Date.parse(iso) ? { endDate: iso } : {}),
                        });
                      }}
                    />
                    <span aria-hidden>–</span>
                    <Input
                      type={entry.allDay ? "date" : "datetime-local"}
                      className="w-auto"
                      aria-label="End (Munich), optional"
                      min={fmt(entry.startDate, entry.allDay)}
                      value={entry.endDate ? fmt(entry.endDate, entry.allDay) : ""}
                      onChange={(e) => {
                        const iso = berlinIso(e.target.value);
                        if (!e.target.value) patch(i, { endDate: undefined });
                        else if (iso && Date.parse(iso) >= Date.parse(entry.startDate)) patch(i, { endDate: iso });
                      }}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!entry.allDay}
                        onChange={(e) =>
                          patch(
                            i,
                            e.target.checked
                              ? {
                                  allDay: true,
                                  startDate: berlinIso(berlinLocal(entry.startDate).slice(0, 10))!,
                                  endDate: entry.endDate && berlinIso(berlinLocal(entry.endDate).slice(0, 10))!,
                                }
                              : { allDay: undefined },
                          )
                        }
                      />
                      All day
                    </label>
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
