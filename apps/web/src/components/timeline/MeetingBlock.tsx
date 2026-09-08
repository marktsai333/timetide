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
  const height = Math.max(end.diff(start, "hours").hours * PX_PER_HOUR, 24);
  const confirmed = meeting.status === "confirmed";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(meeting.id);
      }}
      className="absolute left-2 right-2 rounded-lg px-2 flex items-center cursor-pointer"
      style={{
        top,
        height,
        zIndex: 4,
        background: confirmed ? "var(--rail-self)" : "var(--rail-self-soft)",
        border: confirmed ? "none" : "1px dashed var(--rail-self)",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: confirmed ? "#031018" : "var(--rail-self)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {meeting.title || (confirmed ? "已確認" : "提議中")}
      </span>
    </div>
  );
}
