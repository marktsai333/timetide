import { useState } from "react";
import { DateTime } from "luxon";
import { Sheet } from "../Sheet";
import { usePairingStore } from "../../state/usePairingStore";
import {
  formatMeetingDuration,
  localDateTimeInputValue,
  MIN_MEETING_MINUTES,
  parseLocalDateTimeInput,
} from "../../lib/meeting-time";

export function CreateMeetingSheet({
  open,
  onOpenChange,
  initialStart,
  ianaTimezone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStart: DateTime | null;
  ianaTimezone: string;
}) {
  const formKey = `${initialStart?.toMillis() ?? "now"}:${ianaTimezone}`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="新增行程">
      {open && (
        <CreateMeetingForm
          key={formKey}
          initialStart={initialStart}
          ianaTimezone={ianaTimezone}
          onCreated={() => onOpenChange(false)}
        />
      )}
    </Sheet>
  );
}

function CreateMeetingForm({
  initialStart,
  ianaTimezone,
  onCreated,
}: {
  initialStart: DateTime | null;
  ianaTimezone: string;
  onCreated: () => void;
}) {
  const createMeeting = usePairingStore((state) => state.createMeeting);
  const initial = (initialStart ?? roundUpToQuarterHour(DateTime.now())).setZone(ianaTimezone);
  const [start, setStart] = useState<DateTime>(initial);
  const [end, setEnd] = useState<DateTime>(() => initial.plus({ minutes: 30 }));
  const [title, setTitle] = useState("");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const validRange = end > start;

  function moveMeeting(minutes: number) {
    setStart((current) => current.plus({ minutes }));
    setEnd((current) => current.plus({ minutes }));
  }

  function handleStartChange(value: string) {
    const nextStart = parseLocalDateTimeInput(value, ianaTimezone);
    if (!nextStart) return;
    const durationMillis = Math.max(end.toMillis() - start.toMillis(), MIN_MEETING_MINUTES * 60_000);
    setStart(nextStart);
    setEnd(DateTime.fromMillis(nextStart.toMillis() + durationMillis, { zone: ianaTimezone }));
  }

  function handleEndChange(value: string) {
    const nextEnd = parseLocalDateTimeInput(value, ianaTimezone);
    if (nextEnd) setEnd(nextEnd);
  }

  async function handleSubmit() {
    if (!validRange) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await createMeeting({
        startAt: start.toUTC().toISO()!,
        endAt: end.toUTC().toISO()!,
        title: title.trim() || "打電話",
        reminderMinutesBefore,
      });
      onCreated();
    } catch (error) {
      setSubmitError((error as Error).message || "建立行程失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center rounded-2xl p-3"
        style={{ background: "var(--glass-bg-strong)" }}
      >
        <label htmlFor="meeting-start" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          開始
        </label>
        <input
          id="meeting-start"
          type="datetime-local"
          step={900}
          value={localDateTimeInputValue(start, ianaTimezone)}
          onChange={(event) => handleStartChange(event.target.value)}
          className="min-w-0 rounded-xl px-3 py-2"
          style={{ background: "var(--bg)", color: "var(--text)", colorScheme: "dark", fontSize: 14 }}
        />
        <label htmlFor="meeting-end" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          結束
        </label>
        <input
          id="meeting-end"
          type="datetime-local"
          step={900}
          min={localDateTimeInputValue(start.plus({ minutes: MIN_MEETING_MINUTES }), ianaTimezone)}
          value={localDateTimeInputValue(end, ianaTimezone)}
          onChange={(event) => handleEndChange(event.target.value)}
          className="min-w-0 rounded-xl px-3 py-2"
          style={{ background: "var(--bg)", color: "var(--text)", colorScheme: "dark", fontSize: 14 }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-1" style={{ fontSize: 12 }}>
        <span className="truncate" style={{ color: "var(--text-muted)" }}>
          {ianaTimezone}
        </span>
        <span
          className="shrink-0"
          style={{ color: validRange ? "var(--meeting-accent)" : "#ff6b6b", fontWeight: 700 }}
        >
          {validRange ? formatMeetingDuration(start, end) : "結束時間必須晚於開始時間"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => moveMeeting(-15)}
          className="flex-1 rounded-full py-2.5"
          style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
        >
          整段 −15 分鐘
        </button>
        <button
          type="button"
          onClick={() => moveMeeting(15)}
          className="flex-1 rounded-full py-2.5"
          style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
        >
          整段 +15 分鐘
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>快速設定時長</p>
        <div className="grid grid-cols-4 gap-2">
          {[30, 60, 120, 240].map((minutes) => (
            <button
              type="button"
              key={minutes}
              onClick={() => setEnd(start.plus({ minutes }))}
              className="rounded-full py-2"
              style={{ fontSize: 13, fontWeight: 600, background: "var(--glass-bg-strong)" }}
            >
              {minutes < 60 ? `${minutes} 分` : `${minutes / 60} 小時`}
            </button>
          ))}
        </div>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="標題（選填，預設「打電話」）"
        className="rounded-2xl px-4 py-3"
        style={{ background: "var(--glass-bg-strong)", fontSize: 15 }}
      />

      <div className="flex flex-col gap-1.5">
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>提前提醒</p>
        <div className="flex gap-2">
          {[5, 15, 30, 60].map((minutes) => (
            <button
              type="button"
              key={minutes}
              onClick={() => setReminderMinutesBefore(minutes)}
              className="flex-1 rounded-full py-2"
              style={{
                fontSize: 13,
                fontWeight: 600,
                background: "var(--glass-bg-strong)",
                border:
                  reminderMinutesBefore === minutes
                    ? "1px solid var(--meeting-accent)"
                    : "1px solid transparent",
                color: reminderMinutesBefore === minutes ? "var(--meeting-accent)" : "var(--text-muted)",
              }}
            >
              {minutes} 分鐘
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy || !validRange}
        className="rounded-full py-3"
        style={{
          fontSize: 15,
          fontWeight: 700,
          background: "var(--rail-self)",
          color: "#031018",
          opacity: validRange ? 1 : 0.45,
        }}
      >
        {busy ? "送出中…" : "送出提議"}
      </button>
      {submitError && (
        <p role="alert" style={{ fontSize: 12, color: "#ff6b6b", margin: 0 }}>
          {submitError}
        </p>
      )}
    </div>
  );
}

function roundUpToQuarterHour(dateTime: DateTime): DateTime {
  const remainder = dateTime.minute % 15;
  const exactlyOnQuarter = remainder === 0 && dateTime.second === 0 && dateTime.millisecond === 0;
  const minutesToAdd = exactlyOnQuarter ? 0 : 15 - remainder;
  return dateTime.plus({ minutes: minutesToAdd }).set({ second: 0, millisecond: 0 });
}
