import { DateTime } from "luxon";

export const MEETING_SNAP_MINUTES = 15;
export const MIN_MEETING_MINUTES = 15;

const SNAP_MILLISECONDS = MEETING_SNAP_MINUTES * 60_000;

export function snapMeetingInstant(instant: DateTime): DateTime {
  return DateTime.fromMillis(Math.round(instant.toMillis() / SNAP_MILLISECONDS) * SNAP_MILLISECONDS, {
    zone: instant.zone,
  });
}

export function formatMeetingDuration(start: DateTime, end: DateTime): string {
  const totalMinutes = Math.max(0, Math.round(end.diff(start, "minutes").minutes));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小時`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} 分鐘`);
  return parts.join(" ");
}

export function formatMeetingRange(start: DateTime, end: DateTime, ianaTimezone: string): string {
  const zonedStart = start.setZone(ianaTimezone).setLocale("zh-TW");
  const zonedEnd = end.setZone(ianaTimezone).setLocale("zh-TW");
  if (zonedStart.hasSame(zonedEnd, "day")) {
    return `${zonedStart.toFormat("MM/dd HH:mm")}–${zonedEnd.toFormat("HH:mm")}`;
  }
  return `${zonedStart.toFormat("MM/dd HH:mm")}–${zonedEnd.toFormat("MM/dd HH:mm")}`;
}

export function localDateTimeInputValue(instant: DateTime, ianaTimezone: string): string {
  return instant.setZone(ianaTimezone).toFormat("yyyy-MM-dd'T'HH:mm");
}

export function parseLocalDateTimeInput(value: string, ianaTimezone: string): DateTime | null {
  const parsed = DateTime.fromISO(value, { zone: ianaTimezone });
  return parsed.isValid ? parsed : null;
}
