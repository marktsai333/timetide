import type { MouseEvent } from "react";
import { DateTime } from "luxon";
import { offsetPxForInstant } from "../../lib/rows";
import { PX_PER_HOUR } from "../../lib/timeline-constants";
import type { MeetingWithId } from "../../lib/pairing";

function EventCard({
  side,
  confirmed,
  label,
  top,
  height,
  onClick,
}: {
  side: "self" | "partner";
  confirmed: boolean;
  label: string;
  top: number;
  height: number;
  onClick: (e: MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="absolute rounded-lg px-2 py-1 flex items-center cursor-pointer"
      style={{
        top,
        height,
        left: side === "self" ? "12.5%" : "62.5%",
        width: "25%",
        background: confirmed ? "var(--meeting-accent)" : "var(--meeting-accent-soft)",
        border: confirmed ? "none" : "1px dashed var(--meeting-accent)",
        boxShadow: confirmed ? "0 1px 4px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: confirmed ? "#04140d" : "var(--meeting-accent)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function MeetingBlock({
  meeting,
  rangeStart,
  myUid,
  onSelect,
}: {
  meeting: MeetingWithId;
  rangeStart: DateTime;
  myUid: string | null;
  onSelect: (meetingId: string) => void;
}) {
  const start = DateTime.fromISO(meeting.startAt);
  const end = DateTime.fromISO(meeting.endAt);
  const top = offsetPxForInstant(start, rangeStart);
  const height = Math.max(end.diff(start, "hours").hours * PX_PER_HOUR, 32);
  const confirmed = meeting.status === "confirmed";
  const isMine = myUid !== null && meeting.proposedByUid === myUid;
  const label = meeting.title || (confirmed ? "已確認" : "提議中");

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onSelect(meeting.id);
  }

  if (confirmed) {
    return (
      <>
        <EventCard side="self" confirmed label={label} top={top} height={height} onClick={handleClick} />
        <EventCard side="partner" confirmed label={label} top={top} height={height} onClick={handleClick} />
      </>
    );
  }

  return (
    <EventCard
      side={isMine ? "self" : "partner"}
      confirmed={false}
      label={label}
      top={top}
      height={height}
      onClick={handleClick}
    />
  );
}
