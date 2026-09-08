# TimeTide — 雙人時差時間軸 PWA

## Context

你和另一半（或朋友）分隔兩地、有時差，想要一個好用的方式同時看到兩人的時間軸並約時間見面。核心體驗是你自己描述的畫面：像種下一顆種子、長出一條長長的時間軸，垂直捲動時左右兩側同時顯示雙方的當地時間（同一橫向位置 = 同一個絕對時刻）。這是最基本、也是最重要的功能，必須做得精緻、有質感（遵循 `apple-design` skill 的動效/材質/字體規範）。

之後還想要：顯示對方的忙碌/空閒（像 Google Calendar 的忙碌查詢）、串接 Google/Apple 行事曆（可選擇顯示完整行程或只顯示忙碌狀態）、以及約定時間後同步寫回雙方行事曆或設提醒。這些都需要帳號配對 + OAuth 串接的後端，工程量遠大於時間軸本身。

**這次的範圍**：把時間軸 PWA 的 MVP 做到可以在 iPhone 上「加入主畫面」實際使用（本機、雙方時區手動設定，尚無真正配對），同時把帳號/配對/行事曆串接的後端骨架設計好、資料庫 schema 建好（但不做真正的 Google/Apple OAuth 金鑰交換）——讓未來要接行事曆同步時，架構已經就位，不用重新設計資料模型。

專案資料夾裡目前有兩種 PWA 慣例可參考：[expense-tracker](/Users/marktsai333/Projects/expense-tracker)（React+TS+Vite+vite-plugin-pwa，較現代化、元件化）與 `power-tracker`（純 vanilla，起步快但難擴充）。已確認採用 **expense-tracker 的模式**，因為這個 app 之後功能會持續擴充（時間軸互動、行事曆整合），元件化架構比較合適。已讀過 [expense-tracker/vite.config.ts](/Users/marktsai333/Projects/expense-tracker/vite.config.ts) 和 [expense-tracker/AGENTS.md](/Users/marktsai333/Projects/expense-tracker/AGENTS.md) 確認慣例（PWA manifest 寫法、`.scratch/` demo → Playwright 驗證 → 使用者簽核 → 搬進 `src/` 的標準工作流程、Service Worker 只在 HTTPS/localhost 生效、選 PWA 而非原生 App 的理由）。這次會延續同一套工作流程與 `docs/apple-design.md` 動效規範。

專案資料夾裡沒有任何行事曆/時區相關的既有程式碼可重用，時區數學與後端帳號架構都是從零設計。

## 專案名稱與結構

新專案：`/Users/marktsai333/Projects/timetide`（獨立 git repo，不放進現有專案裡）。

**單一 repo + npm workspaces**（不是兩個分開的 repo，也不上 Turborepo/Nx）：前後端會共用 User/Pairing/TimezoneProfile/CalendarConnection/Meeting 的型別定義，一人開發、沒有多團隊各自消費前後端的需求，npm workspaces 就足夠把共用型別（`packages/shared`）用一般 `import` 接起來，不需要額外的建置協調工具。

```
timetide/
├── package.json                  # root workspaces: ["apps/*", "packages/*"]
├── tsconfig.base.json
├── .oxlintrc.json
├── AGENTS.md                     # 比照 expense-tracker：技術棧、.scratch/ 工作流程、apple-design 規則
├── docs/
│   └── apple-design.md           # 動效/材質規範（apple-design skill 內容）
├── apps/
│   ├── web/                      # PWA 本體
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/icons/
│   │   └── src/
│   │       ├── screens/          # TimelineScreen, OnboardingFlow
│   │       ├── components/timeline/
│   │       ├── state/            # useTimelineStore (zustand + idb)
│   │       └── lib/              # timezone.ts, rows.ts, timeline-constants.ts, haptics.ts
│   └── api/                      # 後端骨架（本次只建架構，不接真 OAuth）
│       ├── prisma/schema.prisma
│       └── src/{server.ts, routes/, plugins/}
└── packages/
    └── shared/src/index.ts       # zod schema，前後端共用
```

## 前端：雙軌時間軸（本次的核心交付）

- **技術**：React + TypeScript + Vite + `vite-plugin-pwa`，狀態用 zustand + `idb`（比照 [expense-tracker/src/lib/db.ts](/Users/marktsai333/Projects/expense-tracker/src/lib/db.ts) 的 pattern），動效用 `motion`，虛擬捲動用 `@tanstack/react-virtual`，時區計算用 **Luxon**（比 `date-fns-tz` 更適合處理 DST 邊界與雙時區逐行換算）。
- **方向**：垂直捲動，時間由上往下推進（符合 Apple/Google 行事曆日檢視的既有心智模型）。「現在」的位置在載入時自動捲到偏上 1/3 處，同時看得到一點過去與較多未來。
- **關鍵架構決定：只用一個捲動容器，不是兩個同步捲動的元素**。用 CSS grid（左軌｜中軸｜右軌）包在單一 `overflow-y: auto` 容器裡，一個 `@tanstack/react-virtual` 虛擬器同時驅動兩軌——這樣兩軌永遠不會有「同步捲動位置」的 bug，因為根本只有一個捲動位置。列粒度抓「每小時一列」（不做到每分鐘，避免虛擬清單列數過多），子小時用 CSS 漸層刻度表示。`PX_PER_HOUR` 抽成單一常數，之後要做縮放（pinch-to-zoom）只改一個數字。
- **必須做對的細節**：同一列（同一絕對時刻）在兩個時區的「當地日期」可能不同（例如台北週二早上 = 洛杉磯週一傍晚）。`DayDivider` 必須**各自獨立**用自己那一軌的日期變化來判斷，不能用另一軌的日期反推。這個「換日瞬間」正是這個 app 最有情感價值的部分，值得做專屬的視覺處理（例如日期標籤淡入），不是隨便一條分隔線。
- **NowIndicator**（現在時刻的指示線）：橫跨兩軌的玻璃感光線，位置用 `requestAnimationFrame`/`setInterval` 連續計算（不卡在整點格線上），呼吸動畫用 opacity 0.85↔1 + scale 1.0↔1.03、約 1.8 秒循環（依 `apple-design` 規範避免過慢的全螢幕級呼吸感造成不適）；`prefers-reduced-motion` 時改成靜態實線。
- **動效原則**：時間軸本身的捲動**用原生 `overflow-y: auto`**，不要自己刻拖曳物理——iOS Safari 原生就有正確的 rubber-banding 和慣性減速（`apple-design` 規範第 9、6 點）。把 `motion` 的彈簧動畫留給真正需要客製手勢的地方：TimezonePicker 用 sheet 下拉關閉（直接沿用 [expense-tracker/src/components/Sheet.tsx](/Users/marktsai333/Projects/expense-tracker/src/components/Sheet.tsx) 的拖曳/阻尼參數）、頂部半透明 toolbar（模糊背景、內容從下方捲過）。
- **iOS 震動限制**：iOS Safari 完全不支援 Vibration API（`navigator.vibrate` 在 iPhone 上是 no-op），`lib/haptics.ts` 要包 `if ('vibrate' in navigator)` 防呆，但實際的「觸覺回饋」要靠彈簧動效本身的即時性，必要時搭配極短的 Web Audio 提示音（節制使用）。

## 元件清單

```
screens/TimelineScreen.tsx        # 擁有唯一捲動容器 + virtualizer
screens/OnboardingFlow.tsx        # 首次啟動：先選「我」的時區，再選「對方」的時區
components/timeline/
  DualRailViewport.tsx  TimeRail.tsx  TimeRowCell.tsx  DayDivider.tsx
  NowIndicator.tsx  RailHeader.tsx  TimelineToolbar.tsx  TimezonePicker.tsx
lib/
  timezone.ts     # 記憶化 Intl.DateTimeFormat cache、rowInstantAt()、日期邊界判斷
  rows.ts         # 列索引 <-> 絕對時刻的純函式
  timeline-constants.ts   # PX_PER_HOUR、過去/未來範圍天數
  haptics.ts
state/useTimelineStore.ts  # zustand + idb 持久化 selfProfile / partnerProfile
```

MVP 捲動範圍固定為「過去 3 天～未來 30 天」（約 800 個小時列，虛擬捲動下輕鬆應付），真正無限捲動之後再加（純前端改動，不影響資料模型）。

## PWA 設定

比照 [expense-tracker/vite.config.ts](/Users/marktsai333/Projects/expense-tracker/vite.config.ts) 的 `VitePWA` 設定調整：`name: 'TimeTide'`、`display: 'standalone'`、深色系 `theme_color`/`background_color`（呼應「跨時空兩座時鐘」的主題）、192/512 maskable icon 給 manifest，**另外做一張沒有 padding 的 180×180 `apple-touch-icon.png`**（iOS 不吃 maskable safe-zone，直接沿用會偏小/偏移）。`index.html` 的 iOS meta tags（`viewport-fit=cover`、`apple-mobile-web-app-capable`、`black-translucent` 狀態列）直接照抄 expense-tracker 現有寫法。Safe area 用 `env(safe-area-inset-*)`，比照 `Sheet.tsx` 已驗證過的 `calc(20px + env(safe-area-inset-bottom))` 寫法。

**本機測試「加入主畫面」**：Service Worker 只在 `localhost` 或真正 HTTPS 生效，區網 IP（`http://192.168.x.x`）測不出來（expense-tracker 已踩過這個坑）。畫面/手感先用 `vite --host` 在區網測，PWA 安裝/離線快取等完整體驗要部署到真實 HTTPS（GitHub Pages，`npm run build && npx gh-pages -d dist`，跟 expense-tracker 部署方式一致）才能驗證。

## 後端與帳號架構（本次只建骨架，不接真 OAuth）

**Fastify + TypeScript + Prisma + SQLite**：SQLite 對兩人使用的 app 來說是最低維運成本的選擇（單一檔案、備份就是複製檔案），Prisma 的 schema-as-migration 之後要換 Postgres 只需改一行 `datasource`。認證不做帳號密碼，用「裝置發一組 bearer token，只存 hash」的方式（比照 expense-tracker 未來規劃也是配對代碼而非帳密登入的方向）。

`apps/api/prisma/schema.prisma` 主要模型：`User`（裝置 token hash）、`Pairing`（邀請碼配對兩個 User，15 分鐘 TTL）、`TimezoneProfile`（IANA 時區、顯示名稱）、`CalendarConnection`（provider: GOOGLE/APPLE_ICLOUD、syncMode: FREE_BUSY_ONLY/FULL_DETAILS、狀態固定 `PENDING`，token 欄位先留空並註記「之後要加密儲存」的 TODO）、`CalendarBusyBlock`（未來同步行事曆忙碌區塊的快取表，這次建表但沒有任何 job 會寫入）、`Meeting`（提案時間、狀態、`syncToCalendar`/`reminderOnly` 旗標）。

路由骨架：`POST /api/users`（裝置註冊發 token）、`POST /api/pairings` + `POST /api/pairings/redeem`（配對碼建立/兌換）、`timezoneProfiles`、`calendarConnections`（CRUD，狀態永遠是 PENDING）、`meetings`（建立/列出提案）。這些路由讓配對/行事曆功能未來要做時「資料庫已經在」，但這次前端完全不會呼叫這個後端（時間軸 MVP 純本機/IndexedDB）。

**明確記錄、但這次不做**：
- 真正的 Google Calendar OAuth（未來需要 Google Cloud OAuth client id/secret，scope `calendar.readonly` 或 `calendar.events`）或 Apple/iCloud 串接（Apple 沒有公開 OAuth，實務上要走 CalDAV + iCloud App 專用密碼，跟 Google 的 REST API 是完全不同的整合方式，之後應該當獨立子專案規劃）
- 行事曆忙碌/空閒的真正同步、寫回行事曆、推播提醒
- 前端接上這個後端的任何 UI（帳號/配對畫面留到下一輪）
- Token 欄位的加密儲存（schema 裡用 TODO 註記，真的存 token 前一定要做）
- Pinch-to-zoom、真正無限捲動、CI/CD、一人配對多人（`TimezoneProfile` 目前設計為每個 User 唯一一筆，之後要「同時看多人」是另一次的 schema 改動）

## 建置順序

1. Repo 骨架：root `package.json`（workspaces）、`tsconfig.base.json`、`packages/shared`
2. `apps/web` 骨架 + PWA 設定，先跑通「加入主畫面」再寫時間軸邏輯
3. 時區數學（`timezone.ts`/`rows.ts`，純函式，先用小腳本驗證 DST 邊界與雙時區換日的正確性）
4. `useTimelineStore`（zustand + idb）
5. 雙軌渲染（`DualRailViewport`/`TimeRail`/`TimeRowCell`/`DayDivider`）—— **依照 expense-tracker 既有工作流程，先在 `.scratch/` 做成獨立 HTML demo + Playwright 驗證腳本，經你親自檢視、簽核後，才搬進 `src/` 正式程式碼**，時間軸對齊與換日視覺是最值得先做 demo 驗證的部分
6. Chrome/動效（`RailHeader`/`TimelineToolbar`/`NowIndicator`/`haptics.ts`）
7. Onboarding（`TimezonePicker` 沿用 `Sheet.tsx`、`OnboardingFlow`）
8. `apps/api` 後端骨架（與前端解耦，第 1 步做完就可以平行進行）：Prisma schema → Fastify server → `users`/`pairings`/`timezoneProfiles`/`calendarConnections`/`meetings` 路由 → `packages/shared` 補上對應 zod schema

## 驗證方式

- `.scratch/` demo 用 Playwright 腳本自動跑過雙軌對齊、換日分隔線、NowIndicator 動畫等情境並截圖，比照 expense-tracker 現有驗證方式
- `npm run build` 確認 Vite/PWA 建置成功；用 `vite --host` 在 iPhone Safari 上實測捲動手感與 safe-area
- 部署到 GitHub Pages 後在 iPhone 上「加入主畫面」，確認 standalone 模式、icon、啟動畫面正確
- 後端骨架：`npx prisma migrate dev` 確認 schema 可建立，用 curl/Postman 打 `POST /api/users` → `POST /api/pairings` → `POST /api/pairings/redeem` 走一次配對流程，確認資料庫寫入正確
