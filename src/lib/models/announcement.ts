export type Announcement = {
  id: string;
  title: string;
  content: string;
  start: Date;
  end?: Date;
  /** Show the date only. */
  allDay: boolean;
  /** When it counts as past (ms): end, else start; for all-day events the midnight after that day. */
  pastAt: number;
};
