import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateDraft, type Draft } from "@/lib/edit";
import type { Contact } from "@/lib/models/contact";

type Training = Contact["trainingHours"][number];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const setContact = (change: Partial<Contact>) => updateDraft((d) => ({ ...d, contact: { ...d.contact, ...change } }));

const setTraining = (fn: (list: Training[]) => Training[]) =>
  updateDraft((d) => ({ ...d, contact: { ...d.contact, trainingHours: fn(d.contact.trainingHours) } }));

const patch = (i: number, change: Partial<Training>) =>
  setTraining((list) => list.map((t, j) => (j === i ? { ...t, ...change } : t)));

export function ContactEditor({ draft }: { draft: Draft }) {
  const { contact } = draft;

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-4xl font-bold">Contact</h1>
        <p className="mb-8 text-muted-foreground">Shown in the footer and on the about page.</p>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Name</span>
                <Input value={contact.name} onChange={(e) => setContact({ name: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Email</span>
                <Input
                  type="email"
                  aria-invalid={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)}
                  value={contact.email}
                  onChange={(e) => setContact({ email: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Instagram link</span>
                <Input
                  type="url"
                  placeholder="https://www.instagram.com/…"
                  aria-invalid={!contact.instagram.startsWith("https://www.instagram.com/")}
                  value={contact.instagram}
                  onChange={(e) => setContact({ instagram: e.target.value })}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Training hours</CardTitle>
              <Button
                onClick={() =>
                  setTraining((list) => [...list, { day: "Monday", start: "19:00", end: "20:30", location: "" }])
                }
              >
                <Plus />
                Add training
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.trainingHours.map((t, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Day"
                    className="h-9 w-auto min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                    value={t.day}
                    onChange={(e) => patch(i, { day: e.target.value })}
                  >
                    {DAYS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <Input
                    type="time"
                    className="w-auto"
                    aria-label="Start"
                    value={t.start}
                    onChange={(e) => patch(i, { start: e.target.value })}
                  />
                  <Input
                    type="time"
                    className="w-auto"
                    aria-label="End"
                    value={t.end}
                    onChange={(e) => patch(i, { end: e.target.value })}
                  />
                  <Input
                    className="min-w-40 flex-1"
                    placeholder="Location"
                    aria-label="Location"
                    aria-invalid={!t.location.trim()}
                    value={t.location}
                    onChange={(e) => patch(i, { location: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove training"
                    onClick={() => setTraining((list) => list.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {contact.trainingHours.length === 0 && <p className="text-muted-foreground">No training hours.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
