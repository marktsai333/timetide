export function TimelineToolbar({
  onJumpToNow,
  onOpenNightSettings,
  onOpenPairing,
  onOpenMeeting,
  paired,
  syncing,
  syncError,
}: {
  onJumpToNow: () => void;
  onOpenNightSettings: () => void;
  onOpenPairing: () => void;
  onOpenMeeting: () => void;
  paired: boolean;
  syncing: boolean;
  syncError: boolean;
}) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-4"
      style={{
        paddingTop: "calc(10px + env(safe-area-inset-top))",
        paddingBottom: 10,
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 17, fontWeight: 700 }}>TimeTide</span>
        {(syncing || syncError) && (
          <span
            aria-live="polite"
            style={{ fontSize: 11, fontWeight: 600, color: syncError ? "#ff6b6b" : "var(--text-muted)" }}
          >
            {syncError ? "同步失敗" : "同步中…"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {paired && (
          <button
            onClick={onOpenMeeting}
            className="rounded-full px-3 py-1.5"
            style={{ fontSize: 13, background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)" }}
            aria-label="約定時間"
          >
            📅
          </button>
        )}
        <button
          onClick={onOpenPairing}
          className="rounded-full px-3 py-1.5"
          style={{ fontSize: 13, background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)" }}
          aria-label="配對"
        >
          {paired ? "🔗" : "👥"}
        </button>
        <button
          onClick={onOpenNightSettings}
          className="rounded-full px-3 py-1.5"
          style={{ fontSize: 13, background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)" }}
          aria-label="夜晚時段設定"
        >
          🌙
        </button>
        <button
          onClick={onJumpToNow}
          className="rounded-full px-3 py-1.5"
          style={{ fontSize: 13, fontWeight: 600, background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)" }}
        >
          現在
        </button>
      </div>
    </div>
  );
}
