import type { DateTime } from "luxon";
import { formatRowTime, isDaytime } from "../../lib/timezone";

export function TimeRowCell({
  instant,
  ianaTimezone,
  align,
  accentVar,
  isPast,
}: {
  instant: DateTime;
  ianaTimezone: string;
  align: "left" | "right";
  accentVar: string;
  isPast: boolean;
}) {
  const label = formatRowTime(instant, ianaTimezone);
  const daytime = isDaytime(instant, ianaTimezone);
  const onHour = instant.setZone(ianaTimezone).minute === 0;
  const opacity = isPast ? 0.3 : daytime ? 1 : 0.55;

  return (
    <div
      className="h-full flex items-center px-3"
      style={{
        justifyContent: align === "left" ? "flex-end" : "flex-start",
        opacity,
      }}
    >
      <span
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: onHour ? 15 : 13,
          fontWeight: onHour ? 600 : 400,
          color: onHour ? `var(${accentVar})` : "var(--text-muted)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
