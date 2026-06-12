import { getDb } from "@/data/db";
import { DEFAULT_SETTINGS } from "@/data/settings-defaults";
import type { Settings } from "@/types/entry";

// Native implementation: one JSON blob in the SQLite settings table.
// (entries get a real schema because we query them; settings are a
// handful of scalars read once, so a KV row is simpler than columns.)

const KEY = "app-settings";

export const settingsRepo = {
  async get(): Promise<Settings> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [KEY],
    );
    if (!row) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
  },

  async save(settings: Settings): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [KEY, JSON.stringify(settings)],
    );
  },
};
