import type { Entry } from "@/types/entry";

export type NewEntryInput = {
  /**
   * The captured photo: a file:// URI on native, a data: URL on web
   * (the browser has no real file paths).
   */
  sourceUri: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Epoch milliseconds. */
  createdAt: number;
  note?: string | null;
  mood?: string | null;
};

/**
 * Platform-neutral persistence for entries. Screens only talk to this
 * interface; Metro picks the implementation per platform
 * (entries-repo.ts = SQLite + file system, entries-repo.web.ts = IndexedDB).
 */
export interface EntriesRepo {
  /** Persists the image (and a thumbnail) and inserts the entry. */
  create(input: NewEntryInput): Promise<Entry>;
  /** All entries, newest first. */
  listAll(): Promise<Entry[]>;
  getById(id: number): Promise<Entry | null>;
  updateNote(
    id: number,
    note: string | null,
    mood: string | null,
  ): Promise<void>;
  /**
   * Replaces the entry's image with an edited version, keeping the
   * very first original so revertEdit can restore it. Re-editing an
   * already-edited entry discards the intermediate version only.
   */
  applyEdit(id: number, editedSourceUri: string): Promise<void>;
  /** Restores the pre-edit original (no-op if never edited). */
  revertEdit(id: number): Promise<void>;
  /** Removes the row/record AND every stored image for the entry. */
  remove(id: number): Promise<void>;
}
