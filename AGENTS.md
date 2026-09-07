# AGENTS.md — TimeTide 專案指南

## 專案概覽

- 技術棧：npm workspaces monorepo。`apps/web`（Vite + React + TypeScript、Tailwind CSS v4、zustand、`motion`、`idb`、`@tanstack/react-virtual`、`luxon`、`vite-plugin-pwa`）、`apps/api`（Fastify + TypeScript + Prisma + SQLite）、`packages/shared`（zod schema，前後端共用）。
- 使用情境：兩個人（本人 + 另一半/朋友）分隔兩地、有時差，用來查看彼此當地時間並約時間見面。沒有 App Store 上架，用 PWA（加入主畫面）的方式在 iPhone 上使用。
- 這次（第一輪）只做：本機、雙方時區手動設定的雙軌時間軸 MVP，以及帳號/配對/行事曆串接的後端骨架（不接真的 Google/Apple OAuth）。詳細規劃見 [`docs/design-plan.md`](docs/design-plan.md)。

## 標準工作流程（每次做畫面/UI 相關開發都要遵守）

沿用 `expense-tracker` 專案已驗證有效的流程：

1. 畫面/互動邏輯較複雜的部分（尤其是雙軌時間軸對齊、換日分隔線這類正確性風險高的東西），先在 `.scratch/` 目錄做成獨立可互動的 demo 或小型驗證腳本，不要一開始就直接動正式 `src/` 程式碼。
2. 任何 UI、動效、手勢（拖曳、滑動、sheet、彈簧動畫等）相關開發，事前務必先讀 [`docs/apple-design.md`](docs/apple-design.md)，並遵守裡面的 spring 參數表、velocity handoff、momentum projection、rubber-banding、材質透明度層級等規則。
3. 清理 `.scratch/` 底下的暫存檔案一律用 `trash` 指令，禁止用 `rm`。
4. 所有回覆一律使用繁體中文（台灣用語）。

## 已知技術限制與坑

- **Node 版本**：需要 Node ≥20.19 或 ≥22.12（本機是 Node 22，沒問題）。
- **Service Worker 只有在 HTTPS 或 `localhost` 才會啟用**：在區網 IP（`http://192.168.x.x`）上測試，PWA 的離線快取、安裝到主畫面這些功能測不出來，要在 `localhost` 或部署後的真實 HTTPS 站台上驗證。
- **iOS Safari 不支援 Vibration API**：`navigator.vibrate` 在 iPhone 上永遠是 no-op，不要把它當成主要的觸覺回饋管道。
- **iOS 的 `apple-touch-icon` 不吃 manifest 的 `purpose: maskable`**：需要另外準備一張沒有 padding 的 180×180 icon 給 `apple-touch-icon`，不能直接沿用 maskable icon。
