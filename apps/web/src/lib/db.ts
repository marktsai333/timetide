import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { TimezoneProfile } from "@timetide/shared";

export interface TimelineSettings {
  id: "timezones";
  self: TimezoneProfile | null;
  partner: TimezoneProfile | null;
}

interface TimeTideDB extends DBSchema {
  settings: {
    key: string;
    value: TimelineSettings;
  };
}

const DB_NAME = "timetide";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TimeTideDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TimeTideDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadTimezoneSettings(): Promise<TimelineSettings> {
  const db = await getDB();
  const existing = await db.get("settings", "timezones");
  return existing ?? { id: "timezones", self: null, partner: null };
}

export async function saveTimezoneSettings(self: TimezoneProfile | null, partner: TimezoneProfile | null) {
  const db = await getDB();
  await db.put("settings", { id: "timezones", self, partner });
}
