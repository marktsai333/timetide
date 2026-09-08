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
import { NightHoursSheet } from "../components/timeline/NightHoursSheet";
import { PairingSheet } from "../components/pairing/PairingSheet";
import { MeetingSheet } from "../components/pairing/MeetingSheet";
import { CreateMeetingSheet } from "../components/pairing/CreateMeetingSheet";
import type { TimezoneCity } from "../lib/timezone-cities";
import { useTimelineStore } from "../state/useTimelineStore";
import { usePairingStore } from "../state/usePairingStore";
import { getUid } from "../lib/firebase";

export function TimelineScreen({ self, partner }: { self: TimezoneProfile; partner: TimezoneProfile }) {
  const setSelf = useTimelineStore((s) => s.setSelf);
  const setPartner = useTimelineStore((s) => s.setPartner);
  const nightStartHour = useTimelineStore((s) => s.nightStartHour);
  const nightEndHour = useTimelineStore((s) => s.nightEndHour);
  const setNightHours = useTimelineStore((s) => s.setNightHours);
  const parentRef = useRef<HTMLDivElement>(null);
  const rangeStart = useMemo(() => getRangeStart(DateTime.utc()), []);
  const [editing, setEditing] = useState<"self" | "partner" | null>(null);
  const [nightSettingsOpen, setNightSettingsOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [createMeetingAt, setCreateMeetingAt] = useState<DateTime | null>(null);
  const [detailMeetingId, setDetailMeetingId] = useState<string | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const now = useNowTick();
  const hydratePairing = usePairingStore((s) => s.hydrate);
  const paired = usePairingStore((s) => s.memberUids.length >= 2);
  const meetings = usePairingStore((s) => s.meetings);
  const seenProposalIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    void hydratePairing();
    void getUid().then(setMyUid);
  }, [hydratePairing]);

  useEffect(() => {
    if (!myUid) return;
    for (const meeting of meetings) {
      if (
        meeting.status === "proposed" &&
        meeting.proposedByUid !== myUid &&
        !seenProposalIds.current.has(meeting.id)
      ) {
        seenProposalIds.current.add(meeting.id);
        setDetailMeetingId(meeting.id);
      }
    }
  }, [meetings, myUid]);

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
      <TimelineToolbar
        onJumpToNow={() => scrollToNow()}
        onOpenNightSettings={() => setNightSettingsOpen(true)}
        onOpenPairing={() => setPairingOpen(true)}
        onOpenMeeting={() => {
          setCreateMeetingAt(null);
          setCreateMeetingOpen(true);
        }}
        paired={paired}
      />
      <div className="grid grid-cols-[1fr_auto_1fr]" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <RailHeader
          profile={self}
          align="left"
          accentVar="--rail-self"
          onTap={() => setEditing("self")}
          nightStartHour={nightStartHour}
          nightEndHour={nightEndHour}
        />
        <div style={{ width: 1 }} />
        <RailHeader
          profile={partner}
          align="right"
          accentVar="--rail-partner"
          onTap={() => setEditing("partner")}
          nightStartHour={nightStartHour}
          nightEndHour={nightEndHour}
        />
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
          nightStartHour={nightStartHour}
          nightEndHour={nightEndHour}
          meetings={paired ? meetings : []}
          myUid={myUid}
          onCreateMeeting={(instant) => {
            if (!paired) return;
            setCreateMeetingAt(instant);
            setCreateMeetingOpen(true);
          }}
          onSelectMeeting={(meetingId) => setDetailMeetingId(meetingId)}
        />
      </div>
      <TimezonePicker
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "self" ? "我在哪裡？" : "對方在哪裡？"}
        onSelect={(city) => editing && handleCitySelect(editing, city)}
      />
      <NightHoursSheet
        open={nightSettingsOpen}
        onOpenChange={setNightSettingsOpen}
        nightStartHour={nightStartHour}
        nightEndHour={nightEndHour}
        onChange={setNightHours}
      />
      <PairingSheet open={pairingOpen} onOpenChange={setPairingOpen} />
      <CreateMeetingSheet open={createMeetingOpen} onOpenChange={setCreateMeetingOpen} initialStart={createMeetingAt} />
      <MeetingSheet
        open={detailMeetingId !== null}
        onOpenChange={(open) => !open && setDetailMeetingId(null)}
        meetingId={detailMeetingId}
      />
    </div>
  );
}
