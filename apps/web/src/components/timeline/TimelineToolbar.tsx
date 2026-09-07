export function TimelineToolbar({ onJumpToNow }: { onJumpToNow: () => void }) {
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
      <span style={{ fontSize: 17, fontWeight: 700 }}>TimeTide</span>
      <button
        onClick={onJumpToNow}
        className="rounded-full px-3 py-1.5"
        style={{ fontSize: 13, fontWeight: 600, background: "var(--glass-bg-strong)", border: "1px solid var(--glass-border)" }}
      >
        現在
      </button>
    </div>
  );
}
