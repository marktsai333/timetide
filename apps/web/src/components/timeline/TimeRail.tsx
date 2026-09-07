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
}: {
  index: number;
  rangeStart: DateTime;
  profile: TimezoneProfile;
  align: "left" | "right";
  accentVar: string;
  now: DateTime;
}) {
  const instant = rowInstantAt(index, rangeStart);
  const showDivider = isLocalDateBoundary(index, rangeStart, profile.ianaTimezone);
  const isPast = instant < now;

  return (
    <div className="relative h-full">
      {showDivider && (
        <DayDivider instant={instant} ianaTimezone={profile.ianaTimezone} align={align} accentVar={accentVar} />
      )}
      <TimeRowCell
        instant={instant}
        ianaTimezone={profile.ianaTimezone}
        align={align}
        accentVar={accentVar}
        isPast={isPast}
      />
    </div>
  );
}
