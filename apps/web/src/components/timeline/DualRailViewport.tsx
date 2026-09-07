import type { DateTime } from "luxon";
import type { VirtualItem } from "@tanstack/react-virtual";
import type { TimezoneProfile } from "@timetide/shared";
import { rowInstantAt } from "../../lib/rows";
import { formatDayLabel } from "../../lib/timezone";
import { TimeRail } from "./TimeRail";
import { NowIndicator } from "./NowIndicator";

function StickyDateBadge({
  label,
  align,
  accentVar,
}: {
  label: string;
  align: "left" | "right";
  accentVar: string;
}) {
  return (
    <div className="flex px-3 pt-2" style={{ justifyContent: align === "left" ? "flex-end" : "flex-start" }}>
      <span
        className="rounded-full px-2.5 py-1"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: `var(${accentVar})`,
          background: "var(--glass-bg-strong)",
          border: "1px solid var(--glass-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function DualRailViewport({
  virtualItems,
  totalSize,
  rangeStart,
  self,
  partner,
  now,
  topRowIndex,
}: {
  virtualItems: VirtualItem[];
  totalSize: number;
  rangeStart: DateTime;
  self: TimezoneProfile;
  partner: TimezoneProfile;
  now: DateTime;
  topRowIndex: number;
}) {
  const topInstant = rowInstantAt(topRowIndex, rangeStart);

  return (
    <div className="relative" style={{ height: totalSize }}>
      <div className="sticky top-0 z-20" style={{ height: 0 }}>
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <StickyDateBadge
            label={formatDayLabel(topInstant, self.ianaTimezone)}
            align="left"
            accentVar="--rail-self"
          />
          <div />
          <StickyDateBadge
            label={formatDayLabel(topInstant, partner.ianaTimezone)}
            align="right"
            accentVar="--rail-partner"
          />
        </div>
      </div>
      <NowIndicator rangeStart={rangeStart} now={now} />
      {virtualItems.map((item) => (
        <div
          key={item.key}
          className="absolute left-0 right-0 grid grid-cols-[1fr_auto_1fr]"
          style={{ top: item.start, height: item.size }}
        >
          <TimeRail
            index={item.index}
            rangeStart={rangeStart}
            profile={self}
            align="left"
            accentVar="--rail-self"
            now={now}
          />
          <div style={{ width: 1, background: "var(--border)" }} />
          <TimeRail
            index={item.index}
            rangeStart={rangeStart}
            profile={partner}
            align="right"
            accentVar="--rail-partner"
            now={now}
          />
        </div>
      ))}
    </div>
  );
}
