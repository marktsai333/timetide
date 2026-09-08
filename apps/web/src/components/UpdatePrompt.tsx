import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        background: "var(--glass-bg-strong)",
        backdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text)" }}>有新版本可以使用</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-full px-4 py-1.5"
        style={{ fontSize: 13, fontWeight: 700, background: "var(--rail-self)", color: "#031018" }}
      >
        立即更新
      </button>
    </div>
  );
}
