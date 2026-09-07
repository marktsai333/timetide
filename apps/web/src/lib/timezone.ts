import type { DateTime } from "luxon";

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateKeyFormatterCache = new Map<string, Intl.DateTimeFormat>();
const offsetFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(ianaTimezone: string): Intl.DateTimeFormat {
  let formatter = timeFormatterCache.get(ianaTimezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    timeFormatterCache.set(ianaTimezone, formatter);
  }
  return formatter;
}

function getDateKeyFormatter(ianaTimezone: string): Intl.DateTimeFormat {
  let formatter = dateKeyFormatterCache.get(ianaTimezone);
  if (!formatter) {
    // en-CA renders YYYY-MM-DD: a stable, sortable key for detecting the local date boundary.
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: ianaTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateKeyFormatterCache.set(ianaTimezone, formatter);
  }
  return formatter;
}

function getOffsetFormatter(ianaTimezone: string): Intl.DateTimeFormat {
  let formatter = offsetFormatterCache.get(ianaTimezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      timeZoneName: "shortOffset",
    });
    offsetFormatterCache.set(ianaTimezone, formatter);
  }
  return formatter;
}

export function formatRowTime(instantUtc: DateTime, ianaTimezone: string): string {
  return getTimeFormatter(ianaTimezone).format(instantUtc.toJSDate());
}

export function formatLocalDateKey(instantUtc: DateTime, ianaTimezone: string): string {
  return getDateKeyFormatter(ianaTimezone).format(instantUtc.toJSDate());
}

export function formatDayLabel(instantUtc: DateTime, ianaTimezone: string): string {
  return instantUtc.setZone(ianaTimezone).toFormat("ccc, LLL d");
}

export function getUtcOffsetLabel(ianaTimezone: string, at: DateTime): string {
  const parts = getOffsetFormatter(ianaTimezone).formatToParts(at.toJSDate());
  const offsetPart = parts.find((part) => part.type === "timeZoneName");
  return offsetPart?.value ?? "";
}

export function isDaytime(instantUtc: DateTime, ianaTimezone: string): boolean {
  const hour = instantUtc.setZone(ianaTimezone).hour;
  return hour >= 6 && hour < 18;
}
