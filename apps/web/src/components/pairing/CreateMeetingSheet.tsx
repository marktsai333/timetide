import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Sheet } from "../Sheet";
import { usePairingStore } from "../../state/usePairingStore";

export function CreateMeetingSheet({
  open,
  onOpenChange,
  initialStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStart: DateTime | null;
}) {
  const createMeeting = usePairingStore((s) => s.createMeeting);
  const [start, setStart] = useState<DateTime>(() => DateTime.now());
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStart(initialStart ?? roundUpToHalfHour(DateTime.now()));
      setTitle("");
    }
  }, [open, initialStart]);

  async function handleSubmit() {
    setBusy(true);
    try {
      const startAt = start.toUTC().toISO()!;
      const endAt = start.plus({ minutes: 30 }).toUTC().toISO()!;
      await createMeeting({ startAt, endAt, title: title || undefined });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="新增行程">
      <div className="flex flex-col gap-3">
        <div
          className="rounded-2xl py-4 text-center"
          style={{ background: "var(--glass-bg-strong)", fontSize: 20, fontWeight: 700 }}
        >
          {start.toLocal().toFormat("yyyy/MM/dd (ccc) HH:mm")}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStart((s) => s.minus({ minutes: 30 }))}
            className="flex-1 rounded-full py-2.5"
            style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
          >
            −30 分鐘
          </button>
          <button
            onClick={() => setStart((s) => s.plus({ minutes: 30 }))}
            className="flex-1 rounded-full py-2.5"
            style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
          >
            +30 分鐘
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStart((s) => s.minus({ days: 1 }))}
            className="flex-1 rounded-full py-2"
            style={{ fontSize: 13, color: "var(--text-muted)", background: "var(--glass-bg-strong)" }}
          >
            −1 天
          </button>
          <button
            onClick={() => setStart((s) => s.plus({ days: 1 }))}
            className="flex-1 rounded-full py-2"
            style={{ fontSize: 13, color: "var(--text-muted)", background: "var(--glass-bg-strong)" }}
          >
            +1 天
          </button>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題（選填）"
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--glass-bg-strong)", fontSize: 15 }}
        />
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="rounded-full py-3"
          style={{ fontSize: 15, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
        >
          {busy ? "送出中…" : "送出提議"}
        </button>
      </div>
    </Sheet>
  );
}

function roundUpToHalfHour(dt: DateTime): DateTime {
  const minute = dt.minute;
  const roundedMinute = minute < 30 ? 30 : 0;
  const base = roundedMinute === 0 ? dt.plus({ hours: 1 }) : dt;
  return base.set({ minute: roundedMinute, second: 0, millisecond: 0 });
}
