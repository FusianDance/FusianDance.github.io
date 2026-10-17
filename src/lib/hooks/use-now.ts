import { useSyncExternalStore } from "react";
import type { Announcement } from "@/lib/models/announcement";

// Pages are prerendered at build time. Render with the build time first (matches the static HTML), then switch to the real time after mount.
const pageLoadTime = Date.now();
const noSubscribe = () => () => {};

export function useNow(buildTime: number) {
  return useSyncExternalStore(
    noSubscribe,
    () => pageLoadTime,
    () => buildTime,
  );
}

// announcements are sorted by pastAt, newest first: index of the first one that is over.
export function todayIndex(announcements: Announcement[], now: number) {
  const found = announcements.findIndex((a) => a.pastAt <= now);
  return found === -1 ? announcements.length : found;
}
