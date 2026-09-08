import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Sheet } from "../Sheet";
import { usePairingStore } from "../../state/usePairingStore";
import { getUid } from "../../lib/firebase";

const STATUS_LABEL: Record<string, string> = {
  proposed: "等待對方回應",
  confirmed: "已確認 ✓",
  declined: "已婉拒",
  cancelled: "已取消",
};

export function MeetingSheet({
  open,
  onOpenChange,
  meetingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string | null;
}) {
  const meetings = usePairingStore((s) => s.meetings);
  const respondToMeeting = usePairingStore((s) => s.respondToMeeting);
  const deleteMeeting = usePairingStore((s) => s.deleteMeeting);
  const [busy, setBusy] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);

  useEffect(() => {
    void getUid().then(setMyUid);
  }, []);

  const meeting = meetingId ? meetings.find((m) => m.id === meetingId) : undefined;

  async function handleRespond(status: "confirmed" | "declined") {
    if (!meetingId) return;
    setBusy(true);
    try {
      await respondToMeeting(meetingId, status);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!meetingId) return;
    setBusy(true);
    try {
      await deleteMeeting(meetingId);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  if (!meeting) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="行程詳情">
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>找不到這筆行程</p>
      </Sheet>
    );
  }

  const isMine = myUid !== null && meeting.proposedByUid === myUid;
  const isActive = meeting.status === "proposed" || meeting.status === "confirmed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="行程詳情">
      <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg-strong)" }}>
        <p style={{ fontSize: 16, fontWeight: 700 }}>
          {DateTime.fromISO(meeting.startAt).toLocal().toFormat("yyyy/MM/dd HH:mm")} –{" "}
          {DateTime.fromISO(meeting.endAt).toLocal().toFormat("HH:mm")}
        </p>
        {meeting.title && <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{meeting.title}</p>}
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          狀態：{STATUS_LABEL[meeting.status] ?? meeting.status}
        </p>
      </div>
      {meeting.status === "proposed" && !isMine && (
        <div className="flex gap-2 mt-3">
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
      {isActive && (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="w-full rounded-full py-2.5 mt-3"
          style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)", color: "#ff6b6b" }}
        >
          刪除行程
        </button>
      )}
    </Sheet>
  );
}
