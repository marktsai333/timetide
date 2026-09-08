import { useState } from "react";
import { Sheet } from "../Sheet";
import { usePairingStore } from "../../state/usePairingStore";

export function PairingSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState<"create" | "redeem">("create");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createInviteCode = usePairingStore((s) => s.createInviteCode);
  const redeemInviteCode = usePairingStore((s) => s.redeemInviteCode);
  const memberUids = usePairingStore((s) => s.memberUids);
  const paired = memberUids.length >= 2;

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const result = await createInviteCode();
      setInviteCode(result.inviteCode);
    } catch {
      setError("產生邀請碼失敗，請檢查網路連線後再試一次");
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeem() {
    if (!redeemInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await redeemInviteCode(redeemInput.trim().toUpperCase());
      onOpenChange(false);
    } catch {
      setError("邀請碼無效或已過期");
    } finally {
      setBusy(false);
    }
  }

  if (paired) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="配對狀態">
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>已經跟對方配對成功 🎉</p>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="跟對方配對">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("create")}
          className="flex-1 rounded-full py-2"
          style={{
            fontSize: 13,
            fontWeight: 600,
            background: "var(--glass-bg-strong)",
            border: tab === "create" ? "1px solid var(--rail-self)" : "1px solid transparent",
            color: tab === "create" ? "var(--rail-self)" : "var(--text-muted)",
          }}
        >
          產生邀請碼
        </button>
        <button
          onClick={() => setTab("redeem")}
          className="flex-1 rounded-full py-2"
          style={{
            fontSize: 13,
            fontWeight: 600,
            background: "var(--glass-bg-strong)",
            border: tab === "redeem" ? "1px solid var(--rail-self)" : "1px solid transparent",
            color: tab === "redeem" ? "var(--rail-self)" : "var(--text-muted)",
          }}
        >
          輸入邀請碼
        </button>
      </div>

      {tab === "create" ? (
        <div className="flex flex-col gap-3">
          {inviteCode ? (
            <>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>把這組代碼傳給對方，15 分鐘內有效：</p>
              <div
                className="rounded-2xl py-4 text-center"
                style={{ background: "var(--glass-bg-strong)", fontSize: 28, fontWeight: 800, letterSpacing: 4 }}
              >
                {inviteCode}
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(inviteCode)}
                className="rounded-full py-2.5"
                style={{ fontSize: 14, fontWeight: 600, background: "var(--glass-bg-strong)" }}
              >
                複製代碼
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={busy}
              className="rounded-full py-3"
              style={{ fontSize: 15, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
            >
              {busy ? "產生中…" : "產生邀請碼"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value)}
            placeholder="輸入對方給你的代碼"
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--glass-bg-strong)", fontSize: 18, textAlign: "center", letterSpacing: 3 }}
            maxLength={6}
          />
          <button
            onClick={handleRedeem}
            disabled={busy || !redeemInput.trim()}
            className="rounded-full py-3"
            style={{ fontSize: 15, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
          >
            {busy ? "確認中…" : "確認配對"}
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 13, color: "#ff6b6b", marginTop: 8 }}>{error}</p>}
    </Sheet>
  );
}
