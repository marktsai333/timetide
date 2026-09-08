import type { CSSProperties, MouseEvent } from "react";
import { DateTime } from "luxon";
import { offsetPxForInstant } from "../../lib/rows";
import { PX_PER_HOUR } from "../../lib/timeline-constants";
import type { MeetingWithId } from "../../lib/pairing";

export function MeetingBlock({
  meeting,
  rangeStart,
  onSelect,
}: {
  meeting: MeetingWithId;
  rangeStart: DateTime;
  onSelect: (meetingId: string) => void;
}) {
  const start = DateTime.fromISO(meeting.startAt);
  const end = DateTime.fromISO(meeting.endAt);
  const top = offsetPxForInstant(start, rangeStart);
  const height = Math.max(end.diff(start, "hours").hours * PX_PER_HOUR, 32);
  const confirmed = meeting.status === "confirmed";

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onSelect(meeting.id);
  }

  const barStyle: CSSProperties = {
    width: 5,
    height: "100%",
    borderRadius: 3,
    background: confirmed ? "var(--meeting-accent)" : "var(--meeting-accent-soft)",
    border: confirmed ? "none" : "1px solid var(--meeting-accent)",
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="absolute left-0 flex items-center justify-start pl-1 cursor-pointer"
        style={{ top, height, width: 20, zIndex: 4 }}
        aria-label={meeting.title || (confirmed ? "已確認的行程" : "提議中的行程")}
      >
        <div style={barStyle} />
      </div>
      <div
        onClick={handleClick}
        className="absolute right-0 flex items-center justify-end pr-1 cursor-pointer"
        style={{ top, height, width: 20, zIndex: 4 }}
        aria-label={meeting.title || (confirmed ? "已確認的行程" : "提議中的行程")}
      >
        <div style={barStyle} />
      </div>
    </>
  );
}
