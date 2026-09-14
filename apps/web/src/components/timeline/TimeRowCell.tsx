import type { DateTime } from "luxon";
import { formatRowTime, isDaytime } from "../../lib/timezone";

export function TimeRowCell({
  instant,
  ianaTimezone,
  align,
  accentVar,
  isPast,
  nightStartHour,
  nightEndHour,
}: {
  instant: DateTime;
  ianaTimezone: string;
  align: "left" | "right";
  accentVar: string;
  isPast: boolean;
  nightStartHour: number;
  nightEndHour: number;
}) {
  const label = formatRowTime(instant, ianaTimezone);
  const daytime = isDaytime(instant, ianaTimezone, nightStartHour, nightEndHour);
  const onHour = instant.setZone(ianaTimezone).minute === 0;
  // 夜晚跟過去是兩種獨立機制疊加，都只用透明度、不改變顏色：
  // 夜晚代表「當地現在就是暗的」，過去代表「這個時段已經結束」，疊加起來最暗。
  const nightOpacity = daytime ? 1 : 0.65;
  const pastOpacity = isPast ? 0.55 : 1;

  return (
    <div className="relative h-full" style={{ opacity: nightOpacity * pastOpacity }}>
      <span
        style={{
          position: "absolute",
          top: 0,
          ...(align === "left" ? { right: 12 } : { left: 12 }),
          transform: "translateY(-50%)",
          zIndex: 6,
          lineHeight: 1.2,
          pointerEvents: "none",
          textShadow: "0 1px 5px var(--bg), 0 0 10px var(--bg)",
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
