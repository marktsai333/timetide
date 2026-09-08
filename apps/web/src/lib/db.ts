import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { TimezoneProfile } from "@timetide/shared";
import { DEFAULT_NIGHT_START_HOUR, DEFAULT_NIGHT_END_HOUR } from "./timezone";

export interface TimelineSettings {
  id: "timezones";
  self: TimezoneProfile | null;
  partner: TimezoneProfile | null;
  nightStartHour: number;
  nightEndHour: number;
}

export interface PairingSettings {
  id: "pairing";
  pairingId: string;
}

interface TimeTideDB extends DBSchema {
  settings: {
    key: string;
    value: TimelineSettings | PairingSettings;
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
  return (
    (existing?.id === "timezones" ? existing : undefined) ?? {
      id: "timezones",
      self: null,
      partner: null,
      nightStartHour: DEFAULT_NIGHT_START_HOUR,
      nightEndHour: DEFAULT_NIGHT_END_HOUR,
    }
  );
}

export async function saveTimezoneSettings(settings: Omit<TimelineSettings, "id">) {
  const db = await getDB();
  await db.put("settings", { id: "timezones", ...settings });
}

export async function loadPairingId(): Promise<string | null> {
  const db = await getDB();
  const existing = await db.get("settings", "pairing");
  return existing && "pairingId" in existing ? existing.pairingId : null;
}

export async function savePairingId(pairingId: string) {
  const db = await getDB();
  await db.put("settings", { id: "pairing", pairingId });
}

export async function clearPairingId() {
  const db = await getDB();
  await db.delete("settings", "pairing");
}
