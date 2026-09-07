import { DateTime } from "luxon";
import { RANGE_PAST_DAYS, PX_PER_HOUR } from "./timeline-constants";
import { formatLocalDateKey } from "./timezone";

export function getRangeStart(now: DateTime): DateTime {
  return now.startOf("hour").minus({ days: RANGE_PAST_DAYS });
}

export function rowInstantAt(index: number, rangeStart: DateTime): DateTime {
  return rangeStart.plus({ hours: index });
}

export function offsetPxForInstant(instant: DateTime, rangeStart: DateTime): number {
  return instant.diff(rangeStart, "hours").hours * PX_PER_HOUR;
}

/**
 * Each rail must judge its own local-date boundary independently — the same row index
 * can cross midnight in one timezone while sitting mid-afternoon in the other.
 */
export function isLocalDateBoundary(index: number, rangeStart: DateTime, ianaTimezone: string): boolean {
  if (index === 0) return true;
  const current = formatLocalDateKey(rowInstantAt(index, rangeStart), ianaTimezone);
  const previous = formatLocalDateKey(rowInstantAt(index - 1, rangeStart), ianaTimezone);
  return current !== previous;
}
