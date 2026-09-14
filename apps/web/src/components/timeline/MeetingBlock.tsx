import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { DateTime } from "luxon";
import { offsetPxForInstant } from "../../lib/rows";
import { PX_PER_HOUR } from "../../lib/timeline-constants";
import {
  formatMeetingRange,
  MIN_MEETING_MINUTES,
  snapMeetingInstant,
} from "../../lib/meeting-time";
import type { MeetingWithId } from "../../lib/pairing";

type GestureMode = "move" | "resize-start" | "resize-end";

interface TimeDraft {
  start: DateTime;
  end: DateTime;
}

interface ActiveGesture {
  mode: GestureMode;
  pointerId: number;
  originClientY: number;
  originScrollTop: number;
  original: TimeDraft;
  captureTarget: HTMLElement;
}

const AUTO_SCROLL_EDGE_PX = 56;
const AUTO_SCROLL_MAX_PX_PER_FRAME = 12;

export function MeetingBlock({
  meeting,
  rangeStart,
  rangeEnd,
  myUid,
  selected,
  selfTimezone,
  partnerTimezone,
  getScrollElement,
  onActivate,
  onOpenDetails,
  onChangeTime,
}: {
  meeting: MeetingWithId;
  rangeStart: DateTime;
  rangeEnd: DateTime;
  myUid: string | null;
  selected: boolean;
  selfTimezone: string;
  partnerTimezone: string;
  getScrollElement: () => HTMLElement | null;
  onActivate: (meetingId: string) => void;
  onOpenDetails: (meetingId: string) => void;
  onChangeTime: (meetingId: string, startAt: string, endAt: string) => Promise<void>;
}) {
  const meetingStart = DateTime.fromISO(meeting.startAt);
  const meetingEnd = DateTime.fromISO(meeting.endAt);
  const [draft, setDraft] = useState<TimeDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftRef = useRef<TimeDraft | null>(null);
  const gestureRef = useRef<ActiveGesture | null>(null);
  const didDragRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);

  const displayStart = draft?.start ?? meetingStart;
  const displayEnd = draft?.end ?? meetingEnd;
  const top = offsetPxForInstant(displayStart, rangeStart);
  const height = Math.max(displayEnd.diff(displayStart, "hours").hours * PX_PER_HOUR, 1);
  const isMine = myUid !== null && meeting.proposedByUid === myUid;
  const confirmed = meeting.status === "confirmed";
  const label = meeting.title || (confirmed ? "已確認" : "提議中");

  useEffect(() => {
    if (gestureRef.current === null) {
      draftRef.current = null;
      setDraft(null);
    }
  }, [meeting.startAt, meeting.endAt]);

  useEffect(() => {
    return () => {
      if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
    };
  }, []);

  function setTimeDraft(next: TimeDraft) {
    draftRef.current = next;
    setDraft(next);
  }

  function clampMove(start: DateTime, end: DateTime): TimeDraft {
    const durationMillis = end.toMillis() - start.toMillis();
    const rangeMillis = rangeEnd.toMillis() - rangeStart.toMillis();
    if (durationMillis >= rangeMillis) return { start, end };
    if (start < rangeStart) {
      return { start: rangeStart, end: rangeStart.plus({ milliseconds: durationMillis }) };
    }
    if (end > rangeEnd) {
      return { start: rangeEnd.minus({ milliseconds: durationMillis }), end: rangeEnd };
    }
    return { start, end };
  }

  function updateDraftFromPointer(clientY: number) {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const scrollTop = getScrollElement()?.scrollTop ?? gesture.originScrollTop;
    const deltaPx = clientY - gesture.originClientY + (scrollTop - gesture.originScrollTop);
    const deltaMinutes = (deltaPx / PX_PER_HOUR) * 60;
    const minimumDuration = { minutes: MIN_MEETING_MINUTES };

    if (gesture.mode === "move") {
      setTimeDraft(
        clampMove(
          gesture.original.start.plus({ minutes: deltaMinutes }),
          gesture.original.end.plus({ minutes: deltaMinutes }),
        ),
      );
      return;
    }

    if (gesture.mode === "resize-start") {
      const latestStart = gesture.original.end.minus(minimumDuration);
      const candidate = gesture.original.start.plus({ minutes: deltaMinutes });
      setTimeDraft({
        start: DateTime.max(rangeStart, DateTime.min(candidate, latestStart)),
        end: gesture.original.end,
      });
      return;
    }

    const earliestEnd = gesture.original.start.plus(minimumDuration);
    const candidate = gesture.original.end.plus({ minutes: deltaMinutes });
    setTimeDraft({
      start: gesture.original.start,
      end: DateTime.min(rangeEnd, DateTime.max(candidate, earliestEnd)),
    });
  }

  function stopAutoScroll() {
    if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
    autoScrollFrameRef.current = null;
  }

  function runAutoScroll() {
    autoScrollFrameRef.current = null;
    if (!gestureRef.current) return;
    const scrollElement = getScrollElement();
    if (!scrollElement) return;
    const bounds = scrollElement.getBoundingClientRect();
    const pointerY = lastPointerYRef.current;
    let delta = 0;

    if (pointerY < bounds.top + AUTO_SCROLL_EDGE_PX) {
      const intensity = Math.min(1, (bounds.top + AUTO_SCROLL_EDGE_PX - pointerY) / AUTO_SCROLL_EDGE_PX);
      delta = -Math.max(2, intensity * AUTO_SCROLL_MAX_PX_PER_FRAME);
    } else if (pointerY > bounds.bottom - AUTO_SCROLL_EDGE_PX) {
      const intensity = Math.min(1, (pointerY - (bounds.bottom - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX);
      delta = Math.max(2, intensity * AUTO_SCROLL_MAX_PX_PER_FRAME);
    }

    if (delta === 0) return;
    const previousScrollTop = scrollElement.scrollTop;
    scrollElement.scrollTop += delta;
    if (scrollElement.scrollTop !== previousScrollTop) {
      didDragRef.current = true;
      updateDraftFromPointer(pointerY);
      autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    }
  }

  function scheduleAutoScroll() {
    if (autoScrollFrameRef.current === null) {
      autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    }
  }

  function beginGesture(mode: GestureMode, event: ReactPointerEvent<HTMLElement>) {
    if (!selected || saving || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const captureTarget = event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);
    const original = { start: displayStart, end: displayEnd };
    gestureRef.current = {
      mode,
      pointerId: event.pointerId,
      originClientY: event.clientY,
      originScrollTop: getScrollElement()?.scrollTop ?? 0,
      original,
      captureTarget,
    };
    draftRef.current = original;
    didDragRef.current = false;
    setSaveError(null);
    lastPointerYRef.current = event.clientY;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    lastPointerYRef.current = event.clientY;
    const moved = Math.abs(event.clientY - gesture.originClientY) > 4;
    if (moved) didDragRef.current = true;
    updateDraftFromPointer(event.clientY);
    scheduleAutoScroll();
  }

  function snappedDraft(gesture: ActiveGesture, current: TimeDraft): TimeDraft {
    if (gesture.mode === "move") {
      const start = snapMeetingInstant(current.start);
      const durationMillis = gesture.original.end.toMillis() - gesture.original.start.toMillis();
      return clampMove(start, start.plus({ milliseconds: durationMillis }));
    }
    if (gesture.mode === "resize-start") {
      const latestStart = current.end.minus({ minutes: MIN_MEETING_MINUTES });
      return { start: DateTime.max(rangeStart, DateTime.min(snapMeetingInstant(current.start), latestStart)), end: current.end };
    }
    const earliestEnd = current.start.plus({ minutes: MIN_MEETING_MINUTES });
    return { start: current.start, end: DateTime.min(rangeEnd, DateTime.max(snapMeetingInstant(current.end), earliestEnd)) };
  }

  async function finishGesture(event: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    stopAutoScroll();
    if (gesture.captureTarget.hasPointerCapture(event.pointerId)) {
      gesture.captureTarget.releasePointerCapture(event.pointerId);
    }
    gestureRef.current = null;

    const current = draftRef.current;
    if (!commit || !didDragRef.current || !current) {
      draftRef.current = null;
      setDraft(null);
      return;
    }

    const snapped = snappedDraft(gesture, current);
    setTimeDraft(snapped);
    setSaving(true);
    try {
      await onChangeTime(meeting.id, snapped.start.toUTC().toISO()!, snapped.end.toUTC().toISO()!);
    } catch {
      setSaveError("時間更新失敗，已恢復原時段");
    } finally {
      setSaving(false);
      draftRef.current = null;
      setDraft(null);
    }
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (selected) onOpenDetails(meeting.id);
    else onActivate(meeting.id);
  }

  async function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selected) onOpenDetails(meeting.id);
      else onActivate(meeting.id);
      return;
    }
    if (!selected || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    const minutes = event.key === "ArrowUp" ? -15 : 15;
    const next = clampMove(displayStart.plus({ minutes }), displayEnd.plus({ minutes }));
    setSaveError(null);
    setSaving(true);
    try {
      await onChangeTime(meeting.id, next.start.toUTC().toISO()!, next.end.toUTC().toISO()!);
    } catch {
      setSaveError("時間更新失敗，已恢復原時段");
    } finally {
      setSaving(false);
    }
  }

  const positionStyle = confirmed
    ? { left: "50%", transform: "translateX(-50%)", minWidth: 112, maxWidth: "85%" }
    : { left: isMine ? "8%" : "70%", width: "22%" };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}，${formatMeetingRange(displayStart, displayEnd, selfTimezone)}。${selected ? "已選取，可上下拖曳調整" : "點一下選取"}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-resize-handle]")) beginGesture("move", event);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => void finishGesture(event, true)}
      onPointerCancel={(event) => void finishGesture(event, false)}
      className="absolute select-none outline-none"
      style={{
        top,
        height,
        zIndex: selected ? 9 : 3,
        touchAction: selected ? "none" : "pan-y",
        cursor: selected ? "grab" : "pointer",
        opacity: saving ? 0.72 : 1,
        ...positionStyle,
      }}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 overflow-hidden ${confirmed ? "rounded-xl" : "rounded-lg"}`}
        style={
          confirmed
            ? {
                border: selected ? "1px solid rgba(255, 225, 166, 0.9)" : "1px solid rgba(255, 205, 116, 0.62)",
                background:
                  "linear-gradient(135deg, rgba(255, 220, 147, 0.34), rgba(240, 180, 41, 0.18) 55%, rgba(180, 111, 18, 0.26))",
                backdropFilter: "blur(8px) saturate(165%)",
                WebkitBackdropFilter: "blur(8px) saturate(165%)",
                boxShadow: selected
                  ? "0 8px 24px rgba(0,0,0,0.38), 0 0 0 2px rgba(255,211,126,0.26), inset 0 1px rgba(255,255,255,0.34)"
                  : "0 5px 16px rgba(0,0,0,0.26), inset 0 1px rgba(255,255,255,0.34), inset 0 -1px rgba(155,90,8,0.28)",
              }
            : {
                background: "var(--meeting-accent-soft)",
                border: selected ? "1px solid rgba(255,225,166,0.9)" : "1px dashed var(--meeting-accent)",
                boxShadow: selected ? "0 0 0 2px rgba(240,180,41,0.22)" : "none",
              }
        }
      >
        {confirmed && (
          <span
            className="absolute inset-x-[12%] top-px h-[45%] rounded-[inherit] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22), transparent)" }}
          />
        )}
      </div>

      <div
        className="absolute inset-0 flex justify-center px-3 pointer-events-none"
        style={{ alignItems: height <= 42 ? "center" : "flex-start", paddingTop: height <= 42 ? 0 : 8 }}
      >
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 12,
            fontWeight: 700,
            color: confirmed ? "#ffe3a8" : "var(--meeting-accent)",
            textShadow: confirmed ? "0 1px 4px rgba(22,10,0,0.8)" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>

      {selected && (
        <>
          <div
            className="absolute left-1/2 bottom-[calc(100%+8px)] -translate-x-1/2 rounded-xl px-2.5 py-1.5 pointer-events-none"
            style={{
              zIndex: 12,
              whiteSpace: "nowrap",
              fontSize: 10,
              fontWeight: 700,
              color: "#f8e1b3",
              background: "rgba(12,23,35,0.84)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(14px) saturate(170%)",
              WebkitBackdropFilter: "blur(14px) saturate(170%)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
            }}
          >
            {formatMeetingRange(displayStart, displayEnd, selfTimezone)} ·{" "}
            {formatMeetingRange(displayStart, displayEnd, partnerTimezone)}
          </div>
          <button
            type="button"
            data-resize-handle
            aria-label="調整開始時間"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => beginGesture("resize-start", event)}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-12 h-6 border-0 bg-transparent cursor-ns-resize"
            style={{ zIndex: 13, touchAction: "none" }}
          >
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-1 rounded-full"
              style={{ background: "rgba(255,231,183,0.9)", boxShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
            />
          </button>
          <button
            type="button"
            data-resize-handle
            aria-label="調整結束時間"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => beginGesture("resize-end", event)}
            className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-12 h-6 border-0 bg-transparent cursor-ns-resize"
            style={{ zIndex: 13, touchAction: "none" }}
          >
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-1 rounded-full"
              style={{ background: "rgba(255,231,183,0.9)", boxShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
            />
          </button>
        </>
      )}
      {saveError && (
        <div
          role="alert"
          className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 rounded-xl px-2.5 py-1.5 pointer-events-none"
          style={{
            zIndex: 14,
            whiteSpace: "nowrap",
            fontSize: 11,
            fontWeight: 700,
            color: "#ffd6d6",
            background: "rgba(79, 20, 24, 0.9)",
            border: "1px solid rgba(255, 144, 144, 0.32)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {saveError}
        </div>
      )}
    </div>
  );
}
