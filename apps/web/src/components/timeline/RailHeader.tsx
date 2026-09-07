import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import type { TimezoneProfile } from "@timetide/shared";
import { getUtcOffsetLabel, isDaytime } from "../../lib/timezone";

export function RailHeader({
  profile,
  align,
  accentVar,
  onTap,
}: {
  profile: TimezoneProfile;
  align: "left" | "right";
  accentVar: string;
  onTap: () => void;
}) {
  const [now, setNow] = useState(() => DateTime.utc());

  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.utc()), 30_000);
    return () => clearInterval(id);
  }, []);

  const daytime = isDaytime(now, profile.ianaTimezone);

  return (
    <button
      onClick={onTap}
      className="flex flex-col py-2 px-3 min-w-0"
      style={{ alignItems: align === "left" ? "flex-end" : "flex-start", textAlign: align === "left" ? "right" : "left" }}
    >
      <span className="flex items-center gap-1" style={{ fontSize: 15, fontWeight: 700, color: `var(${accentVar})` }}>
        {daytime ? "☀️" : "🌙"} {profile.label}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{getUtcOffsetLabel(profile.ianaTimezone, now)}</span>
    </button>
  );
}
