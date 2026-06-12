/**
 * One selfie entry. Multiple entries may share the same `date`;
 * entries within a day are ordered by `createdAt`.
 */
export interface Entry {
  id: number;
  /** Local calendar date, YYYY-MM-DD. Not unique. */
  date: string;
  /** Path to the current (possibly edited) image in the document directory. */
  imageUri: string;
  thumbUri: string | null;
  /** Pre-edit original, kept for non-destructive revert. */
  originalUri: string | null;
  note: string | null;
  mood: string | null;
  /** Epoch milliseconds. */
  createdAt: number;
  editedAt: number | null;
}

export interface Settings {
  reminderEnabled: boolean;
  /** 24h clock, e.g. { hour: 9, minute: 0 }. */
  reminderHour: number;
  reminderMinute: number;
  theme: "system" | "light" | "dark";
}
