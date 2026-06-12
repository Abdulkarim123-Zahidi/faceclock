import { DEFAULT_SETTINGS } from "@/data/settings-defaults";
import type { Settings } from "@/types/entry";

// Web implementation: a few scalars don't justify IndexedDB ceremony.

const KEY = "faceclock-settings";

export const settingsRepo = {
  async get(): Promise<Settings> {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  },

  async save(settings: Settings): Promise<void> {
    localStorage.setItem(KEY, JSON.stringify(settings));
  },
};
