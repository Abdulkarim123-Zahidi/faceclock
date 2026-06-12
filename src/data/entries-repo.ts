import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";

import { renderThumbnail } from "@/data/thumbnails";
import type { EntriesRepo, NewEntryInput } from "@/data/types";
import type { Entry } from "@/types/entry";

// Native implementation: SQLite rows + image files in <documents>/photos.
// The web implementation lives in entries-repo.web.ts (IndexedDB).

type EntryRow = {
  id: number;
  date: string;
  image_uri: string;
  thumb_uri: string | null;
  original_uri: string | null;
  note: string | null;
  mood: string | null;
  created_at: number;
  edited_at: number | null;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openAndMigrate();
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("faceclock.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      image_uri TEXT NOT NULL,
      thumb_uri TEXT,
      original_uri TEXT,
      note TEXT,
      mood TEXT,
      created_at INTEGER NOT NULL,
      edited_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
  `);
  return db;
}

function photosDir(): Directory {
  const dir = new Directory(Paths.document, "photos");
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    date: row.date,
    imageUri: row.image_uri,
    thumbUri: row.thumb_uri,
    originalUri: row.original_uri,
    note: row.note,
    mood: row.mood,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  };
}

function deleteIfExists(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A missing file must not block deleting the entry itself.
  }
}

export const entriesRepo: EntriesRepo = {
  async create(input: NewEntryInput): Promise<Entry> {
    const db = await getDb();
    const dir = photosDir();
    const base = `${input.createdAt}-${Math.random().toString(36).slice(2, 8)}`;

    // Move the capture out of the cache dir into permanent storage.
    const image = new File(input.sourceUri);
    const dest = new File(dir, `${base}.jpg`);
    image.move(dest);

    // Thumbnail renders into the cache dir; move it alongside the image.
    const thumbTemp = new File(await renderThumbnail(dest.uri));
    const thumbDest = new File(dir, `${base}-thumb.jpg`);
    thumbTemp.move(thumbDest);

    const result = await db.runAsync(
      `INSERT INTO entries (date, image_uri, thumb_uri, note, mood, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.date,
        dest.uri,
        thumbDest.uri,
        input.note ?? null,
        input.mood ?? null,
        input.createdAt,
      ],
    );

    return {
      id: result.lastInsertRowId,
      date: input.date,
      imageUri: dest.uri,
      thumbUri: thumbDest.uri,
      originalUri: null,
      note: input.note ?? null,
      mood: input.mood ?? null,
      createdAt: input.createdAt,
      editedAt: null,
    };
  },

  async listAll(): Promise<Entry[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<EntryRow>(
      "SELECT * FROM entries ORDER BY created_at DESC",
    );
    return rows.map(rowToEntry);
  },

  async getById(id: number): Promise<Entry | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<EntryRow>(
      "SELECT * FROM entries WHERE id = ?",
      [id],
    );
    return row ? rowToEntry(row) : null;
  },

  async remove(id: number): Promise<void> {
    const db = await getDb();
    const row = await db.getFirstAsync<EntryRow>(
      "SELECT * FROM entries WHERE id = ?",
      [id],
    );
    if (!row) return;
    // Files first, then the row — photos exist only inside the app, so
    // an orphaned file would be unrecoverable dead weight.
    deleteIfExists(row.image_uri);
    deleteIfExists(row.thumb_uri);
    deleteIfExists(row.original_uri);
    await db.runAsync("DELETE FROM entries WHERE id = ?", [id]);
  },
};
