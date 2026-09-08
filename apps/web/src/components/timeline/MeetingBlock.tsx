import type { MouseEvent } from "react";
import { DateTime } from "luxon";
import { offsetPxForInstant } from "../../lib/rows";
import { PX_PER_HOUR } from "../../lib/timeline-constants";
import type { MeetingWithId } from "../../lib/pairing";

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
  const isMine = myUid !== null && meeting.proposedByUid === myUid;
  const label = meeting.title || "已確認";

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onSelect(meeting.id);
  }

  if (meeting.status === "confirmed") {
    // Both sides agreed -- merge into a single centered pill, like the day-divider labels.
    return (
      <div
        onClick={handleClick}
        className="absolute rounded-full px-3 py-1 flex items-center justify-center cursor-pointer"
        style={{
          top: top + height / 2 - 12,
          left: "50%",
          transform: "translateX(-50%)",
          height: 24,
          zIndex: 3,
          background: "var(--meeting-accent)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
          maxWidth: "70%",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#2b1a02",
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

  // Proposed: leans into the proposer's own side, hugging (but not touching) the center divider.
  return (
    <div
      onClick={handleClick}
      className="absolute rounded-lg px-2 py-1 flex items-center cursor-pointer"
      style={{
        top,
        height,
        left: isMine ? "8%" : "70%",
        width: "22%",
        zIndex: 3,
        background: "var(--meeting-accent-soft)",
        border: "1px dashed var(--meeting-accent)",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--meeting-accent)",
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
