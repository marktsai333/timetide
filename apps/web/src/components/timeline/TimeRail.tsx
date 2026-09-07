import type { DateTime } from "luxon";
import type { TimezoneProfile } from "@timetide/shared";
import { rowInstantAt, isLocalDateBoundary } from "../../lib/rows";
import { TimeRowCell } from "./TimeRowCell";
import { DayDivider } from "./DayDivider";

export function TimeRail({
  index,
  rangeStart,
  profile,
  align,
  accentVar,
  now,
  nightStartHour,
  nightEndHour,
}: {
  index: number;
  rangeStart: DateTime;
  profile: TimezoneProfile;
  align: "left" | "right";
  accentVar: string;
  now: DateTime;
  nightStartHour: number;
  nightEndHour: number;
}) {
  const instant = rowInstantAt(index, rangeStart);
  const showDivider = isLocalDateBoundary(index, rangeStart, profile.ianaTimezone);
  // 這一列代表的是「這一整個小時」，要整個小時都過完才算過去 -- 現在所在的那一小時不算過去。
  const isPast = instant.plus({ hours: 1 }) <= now;

  return (
    <div className="relative h-full">
      {showDivider && (
        <DayDivider instant={instant} ianaTimezone={profile.ianaTimezone} accentVar={accentVar} />
      )}
      <TimeRowCell
        instant={instant}
        ianaTimezone={profile.ianaTimezone}
        align={align}
        accentVar={accentVar}
        isPast={isPast}
        nightStartHour={nightStartHour}
        nightEndHour={nightEndHour}
      />
    </div>
  );
}
