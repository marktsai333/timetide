import type { DateTime } from "luxon";
import { offsetPxForInstant } from "../../lib/rows";

export function NowIndicator({ rangeStart, now }: { rangeStart: DateTime; now: DateTime }) {
  const top = offsetPxForInstant(now, rangeStart);

  return (
    <div
      className="absolute left-0 right-0 now-indicator-pulse"
      style={{
        top,
        height: 2,
        background: "var(--now-line)",
        boxShadow: "0 0 8px var(--now-line)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
