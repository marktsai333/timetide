import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Sheet } from "../Sheet";
import { usePairingStore } from "../../state/usePairingStore";
import { getUid } from "../../lib/firebase";

export function MeetingSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const meeting = usePairingStore((s) => s.meeting);
  const proposeMeeting = usePairingStore((s) => s.proposeMeeting);
  const respondToMeeting = usePairingStore((s) => s.respondToMeeting);
  const [datetime, setDatetime] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);

  useEffect(() => {
    void getUid().then(setMyUid);
  }, []);

  async function handlePropose() {
    if (!datetime) return;
    setBusy(true);
    try {
      const startAt = DateTime.fromISO(datetime).toUTC().toISO()!;
      const endAt = DateTime.fromISO(datetime).plus({ hours: 1 }).toUTC().toISO()!;
      await proposeMeeting({ startAt, endAt, title: title || undefined });
      setDatetime("");
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  async function handleRespond(status: "confirmed" | "declined") {
    setBusy(true);
    try {
      await respondToMeeting(status);
    } finally {
      setBusy(false);
    }
  }

  const isMine = meeting !== null && myUid !== null && meeting.proposedByUid === myUid;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="約定時間">
      {meeting ? (
        <div className="flex flex-col gap-3 mb-5">
          <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg-strong)" }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>
              {DateTime.fromISO(meeting.startAt).toLocal().toFormat("yyyy/MM/dd HH:mm")}
            </p>
            {meeting.title && <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{meeting.title}</p>}
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              狀態：
              {meeting.status === "proposed" ? "等待對方回應" : meeting.status === "confirmed" ? "已確認 ✓" : "已婉拒"}
            </p>
          </div>
          {meeting.status === "proposed" && !isMine && (
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond("confirmed")}
                disabled={busy}
                className="flex-1 rounded-full py-2.5"
                style={{ fontSize: 14, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
              >
                接受
              </button>
              <button
                onClick={() => handleRespond("declined")}
                disabled={busy}
                className="flex-1 rounded-full py-2.5"
                style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
              >
                婉拒
              </button>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>目前還沒有約定的時間</p>
      )}

      <div className="flex flex-col gap-3">
        <p style={{ fontSize: 13, fontWeight: 600 }}>提議新時間</p>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--glass-bg-strong)", fontSize: 15 }}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題（選填）"
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--glass-bg-strong)", fontSize: 15 }}
        />
        <button
          onClick={handlePropose}
          disabled={busy || !datetime}
          className="rounded-full py-3"
          style={{ fontSize: 15, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
        >
          {busy ? "送出中…" : "送出提議"}
        </button>
      </div>
    </Sheet>
  );
}
