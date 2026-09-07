import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TimezoneProfile } from "@timetide/shared";
import { getRangeStart, offsetPxForInstant } from "../lib/rows";
import { PX_PER_HOUR, TOTAL_HOURS } from "../lib/timeline-constants";
import { useNowTick } from "../lib/useNowTick";
import { TimelineToolbar } from "../components/timeline/TimelineToolbar";
import { RailHeader } from "../components/timeline/RailHeader";
import { DualRailViewport } from "../components/timeline/DualRailViewport";
import { TimezonePicker } from "../components/timeline/TimezonePicker";
import type { TimezoneCity } from "../lib/timezone-cities";
import { useTimelineStore } from "../state/useTimelineStore";

export function TimelineScreen({ self, partner }: { self: TimezoneProfile; partner: TimezoneProfile }) {
  const setSelf = useTimelineStore((s) => s.setSelf);
  const setPartner = useTimelineStore((s) => s.setPartner);
  const parentRef = useRef<HTMLDivElement>(null);
  const rangeStart = useMemo(() => getRangeStart(DateTime.utc()), []);
  const [editing, setEditing] = useState<"self" | "partner" | null>(null);
  const now = useNowTick();

  const virtualizer = useVirtualizer({
    count: TOTAL_HOURS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => PX_PER_HOUR,
    overscan: 8,
  });

  const topRowIndex = Math.max(0, Math.floor((virtualizer.scrollOffset ?? 0) / PX_PER_HOUR));

  function scrollToNow(behavior: ScrollBehavior = "smooth") {
    const el = parentRef.current;
    if (!el) return;
    const nowOffset = offsetPxForInstant(DateTime.utc(), rangeStart);
    el.scrollTo({ top: Math.max(0, nowOffset - el.clientHeight / 3), behavior });
  }

  useEffect(() => {
    scrollToNow("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCitySelect(target: "self" | "partner", city: TimezoneCity) {
    const profile: TimezoneProfile = { ianaTimezone: city.ianaTimezone, label: city.label };
    if (target === "self") setSelf(profile);
    else setPartner(profile);
  }

  return (
    <div className="h-full flex flex-col">
      <TimelineToolbar onJumpToNow={() => scrollToNow()} />
      <div className="grid grid-cols-[1fr_auto_1fr]" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <RailHeader profile={self} align="left" accentVar="--rail-self" onTap={() => setEditing("self")} />
        <div style={{ width: 1 }} />
        <RailHeader profile={partner} align="right" accentVar="--rail-partner" onTap={() => setEditing("partner")} />
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <DualRailViewport
          virtualItems={virtualizer.getVirtualItems()}
          totalSize={virtualizer.getTotalSize()}
          rangeStart={rangeStart}
          self={self}
          partner={partner}
          now={now}
          topRowIndex={topRowIndex}
        />
      </div>
      <TimezonePicker
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "self" ? "我在哪裡？" : "對方在哪裡？"}
        onSelect={(city) => editing && handleCitySelect(editing, city)}
      />
    </div>
  );
}
