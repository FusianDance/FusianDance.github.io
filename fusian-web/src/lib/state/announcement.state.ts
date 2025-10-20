import { Announcement } from "../models/announcement";
import { create } from "zustand";

type AnnouncementStore = {
  announcements: Announcement[];
  todayIndex: number;
};

type AnnouncementConfigEntry = {
  title: string;
  content: string;
  unixtimestamp: number;
};

async function loadAnnouncementsFromJSON(): Promise<Announcement[]> {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, ""); // no trailing slash
  const url = `${base}/announcements.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load announcements.json: ${res.statusText}`);
  }
  const data = (await res.json()) as AnnouncementConfigEntry[];

  let count = 0;
  const announcements: Announcement[] = data.map((entry) => ({
    id: String(count++),
    title: entry.title,
    content: entry.content,
    timestamp: new Date(entry.unixtimestamp * 1000),
  }));
  return announcements;
}

export const useAnnouncementStore = create<AnnouncementStore>((set) => {
  // start with empty state
  const initialState: AnnouncementStore = {
    announcements: [],
    todayIndex: 0,
  };

  // load announcements from config and sort by timestamp
  loadAnnouncementsFromJSON().then((announcements) => {
    announcements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by timestamp, newest first

    // find the index of the last past event
    const now = new Date();
    const todayIndex = announcements.findIndex(
      (announcement) => announcement.timestamp.getTime() <= now.getTime()
    );

    set({
      announcements,
      todayIndex: todayIndex === -1 ? announcements.length : todayIndex, // If no past events, today is at the end
    });
  });

  return initialState;
});
