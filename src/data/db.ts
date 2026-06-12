import * as SQLite from "expo-sqlite";

// Single shared connection + schema for the native side. (Web never
// resolves this module — its repos use IndexedDB/localStorage.)

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
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
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}
