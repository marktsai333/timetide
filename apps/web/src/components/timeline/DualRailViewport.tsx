import type { DateTime } from "luxon";
import type { VirtualItem } from "@tanstack/react-virtual";
import type { TimezoneProfile } from "@timetide/shared";
import { rowInstantAt } from "../../lib/rows";
import { PX_PER_HOUR } from "../../lib/timeline-constants";
import { formatDayLabel } from "../../lib/timezone";
import type { MeetingWithId } from "../../lib/pairing";
import { TimeRail } from "./TimeRail";
import { NowIndicator } from "./NowIndicator";
import { MeetingBlock } from "./MeetingBlock";

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
  nightStartHour,
  nightEndHour,
  meetings,
  myUid,
  selectedMeetingId,
  getScrollElement,
  onCreateMeeting,
  onActivateMeeting,
  onOpenMeetingDetails,
  onChangeMeetingTime,
  onClearMeetingSelection,
}: {
  virtualItems: VirtualItem[];
  totalSize: number;
  rangeStart: DateTime;
  self: TimezoneProfile;
  partner: TimezoneProfile;
  now: DateTime;
  topRowIndex: number;
  nightStartHour: number;
  nightEndHour: number;
  meetings: MeetingWithId[];
  myUid: string | null;
  selectedMeetingId: string | null;
  getScrollElement: () => HTMLElement | null;
  onCreateMeeting: (instant: DateTime) => void;
  onActivateMeeting: (meetingId: string) => void;
  onOpenMeetingDetails: (meetingId: string) => void;
  onChangeMeetingTime: (meetingId: string, startAt: string, endAt: string) => Promise<void>;
  onClearMeetingSelection: () => void;
}) {
  const topInstant = rowInstantAt(topRowIndex, rangeStart);
  const rangeEnd = rangeStart.plus({ hours: totalSize / PX_PER_HOUR });

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
      {meetings.map((meeting) => (
        <MeetingBlock
          key={meeting.id}
          meeting={meeting}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          myUid={myUid}
          selected={selectedMeetingId === meeting.id}
          selfTimezone={self.ianaTimezone}
          partnerTimezone={partner.ianaTimezone}
          getScrollElement={getScrollElement}
          onActivate={onActivateMeeting}
          onOpenDetails={onOpenMeetingDetails}
          onChangeTime={onChangeMeetingTime}
        />
      ))}
      {virtualItems.map((item) => (
        <div
          key={item.key}
          onClick={(e) => {
            if (selectedMeetingId !== null) {
              onClearMeetingSelection();
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const rowInstant = rowInstantAt(item.index, rangeStart);
            onCreateMeeting(offsetY > item.size / 2 ? rowInstant.plus({ minutes: 30 }) : rowInstant);
          }}
          className="absolute left-0 right-0 grid grid-cols-[1fr_auto_1fr] cursor-pointer"
          style={{ top: item.start, height: item.size }}
        >
          <TimeRail
            index={item.index}
            rangeStart={rangeStart}
            profile={self}
            align="left"
            accentVar="--rail-self"
            now={now}
            nightStartHour={nightStartHour}
            nightEndHour={nightEndHour}
          />
          <div style={{ width: 1, background: "var(--border)" }} />
          <TimeRail
            index={item.index}
            rangeStart={rangeStart}
            profile={partner}
            align="right"
            accentVar="--rail-partner"
            now={now}
            nightStartHour={nightStartHour}
            nightEndHour={nightEndHour}
          />
        </div>
      ))}
    </div>
  );
}
