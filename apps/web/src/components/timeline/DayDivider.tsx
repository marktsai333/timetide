import type { DateTime } from "luxon";
import { formatDayLabel } from "../../lib/timezone";

export function DayDivider({
  instant,
  ianaTimezone,
  accentVar,
  align,
}: {
  instant: DateTime;
  ianaTimezone: string;
  accentVar: string;
  align: "left" | "right";
}) {
  const label = formatDayLabel(instant, ianaTimezone);

  return (
    <div
      className="absolute top-5 left-0 right-0 flex px-3 animate-[dayDividerFadeIn_0.4s_var(--ease-out-strong)]"
      style={{
        justifyContent: align === "left" ? "flex-start" : "flex-end",
        pointerEvents: "none",
        zIndex: 7,
      }}
    >
      <span
        className="rounded-full px-2 py-0.5"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: `var(${accentVar})`,
          background: accentVar === "--rail-self" ? "var(--rail-self-soft)" : "var(--rail-partner-soft)",
          border: "1px solid var(--glass-border)",
          backdropFilter: "blur(10px) saturate(150%)",
          WebkitBackdropFilter: "blur(10px) saturate(150%)",
          opacity: 0.86,
          transform: "translateY(-50%)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
