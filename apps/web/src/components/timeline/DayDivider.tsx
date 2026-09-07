import type { DateTime } from "luxon";
import { formatDayLabel } from "../../lib/timezone";

export function DayDivider({
  instant,
  ianaTimezone,
  accentVar,
}: {
  instant: DateTime;
  ianaTimezone: string;
  accentVar: string;
}) {
  const label = formatDayLabel(instant, ianaTimezone);

  return (
    <div
      className="absolute top-0 left-0 right-0 flex px-3 animate-[dayDividerFadeIn_0.4s_var(--ease-out-strong)]"
      style={{ justifyContent: "center", pointerEvents: "none" }}
    >
      <span
        className="rounded-full px-2 py-0.5"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: `var(${accentVar})`,
          background: accentVar === "--rail-self" ? "var(--rail-self-soft)" : "var(--rail-partner-soft)",
          opacity: 0.5,
          transform: "translateY(-50%)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
