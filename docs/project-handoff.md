# TimeTide 專案交接筆記

> 給任何接手這個專案的人（包含未來的你自己、或換到其他工具如 Codex 時）看的：這個專案目前的真實狀態、怎麼走到這裡、有哪些坑踩過不用再踩一次。技術名詞的詳細解釋見 [`complete-tech-tutorial.md`](complete-tech-tutorial.md)；原始功能規劃見 [`design-plan.md`](design-plan.md)。

## 專案是什麼

給分隔兩地、有時差的兩個人用的 App：一條垂直時間軸同時顯示雙方當地時間，可以配對、互約時間、收到推播提醒。以 PWA 形式在 iPhone 上「加入主畫面」使用，沒有上架 App Store。

## 目前狀態：功能都做完了，正式在用

- ✅ 雙軌時間軸（雙方時區、換日分隔線、現在時刻指示線、夜晚時段淡化）
- ✅ 配對（邀請碼機制，可解除配對重新配對）
- ✅ 多筆行程（點時間軸直接建立、提議/確認/婉拒/刪除，時間軸上顯示色塊）
- ✅ 即時同步（Firestore `onSnapshot`，對方不用重新整理就看得到變化）
- ✅ 真正的手機推播（App 完全關閉也收得到，含「行程快到了」的定時提醒）
- 已部署：前端 GitHub Pages（`https://marktsai333.github.io/timetide/`）、推播伺服器 Vercel（`https://push-server-lovat.vercel.app`）

## 架構為什麼長這樣：三次重大轉折

### 轉折一：Fastify+Prisma+Fly.io → Firebase

**原始規劃**是自架 `apps/api`（Fastify + Prisma + SQLite），部署到 Fly.io，作為未來接 Google/Apple 行事曆 OAuth 的骨架。部署到一半發現 **Fly.io 現在連免費額度都要求綁信用卡**。同時釐清了實際需求其實簡單很多——不需要真的串接 Google/Apple 行事曆，只需要「配對＋同步時間＋提醒」。

改用 **Firebase**（Firestore 資料庫 + Anonymous Auth 匿名登入）：不需要信用卡、不用自己架伺服器、前端直接呼叫 Firebase SDK。`apps/api`、`Dockerfile` 保留在 repo 裡沒刪，之後真的要做完整行事曆整合可以撿回來用，但**目前完全沒有在跑，不要花時間維護它**。

### 轉折二：單一 meeting 欄位 → 多筆行程子集合

第一輪的「約定時間」刻意做成「一次只能有一個正在討論的約定」（`pairings/{id}.meeting` 單一欄位）。實際用起來發現不夠——要能像行事曆一樣同時存在多筆行程、點時間軸直接建立、時間軸上要看到色塊。改成子集合 `pairings/{id}/meetings/{meetingId}`，才有辦法同時處理多筆。

### 轉折三：「Blaze 才能做推播」的誤解 → Vercel 免費繞過去

一開始以為「App 關閉也能收到推播」一定要開 Firebase 的 **Blaze（付費）方案**，因為發推播需要 Cloud Functions。後來釐清：**Blaze 只有 Firebase 自家 Cloud Functions 才需要**，FCM 發送 API 本身完全免費，可以放在任何伺服器環境呼叫。改用 **Vercel Serverless Functions**（免費、免信用卡）取代 Cloud Functions，完全繞開這個限制。

「提醒行程快到了」原本想用 Vercel 自己的排程（Cron），但**查證後發現 Vercel 免費方案的 Cron 一天只能跑一次、時間點還不準**，完全不夠用。改用外部免費服務 **cron-job.org** 每 5 分鐘呼叫我們的 API 端點做檢查，繞開這個限制。

**這個轉折的教訓**：遇到「這個平台要收費/要信用卡」的關卡時，先想清楚「到底是整個功能需要付費，還是只有『某一家供應商的某個特定產品』要收費」——很多時候把某一小塊換成別家的免費替代品就能繞過去，不用整個放棄免費路線。

## 目前用到的外部帳號 / 服務（換工具接手要知道去哪裡改設定）

| 服務 | 用途 | 在哪裡設定 |
|---|---|---|
| Firebase 專案 `timetide-bd987` | Firestore 資料庫、匿名登入、Cloud Messaging（推播接收端） | https://console.firebase.google.com |
| GitHub repo | 存放程式碼、GitHub Pages 託管前端 | `marktsai333/timetide` |
| Vercel 專案 `push-server` | 推播伺服器（發送推播、定時檢查提醒） | https://vercel.com/marktsai333/push-server |
| cron-job.org | 每 5 分鐘呼叫 Vercel 的 `/api/check-reminders` | https://console.cron-job.org |

**機密值放在哪裡**（不會寫進這份文件或進 git，實際值要去對應的地方查）：
- `apps/web/.env`（前端環境變數，值本質上是公開的，因為會被打包進公開的 JS）
- Vercel 專案設定的 Environment Variables（`FIREBASE_SERVICE_ACCOUNT`、`APP_SECRET`，這兩個才是真正機密，只存在 Vercel 伺服器上）

## 常用指令

```bash
# 部署前端到 GitHub Pages
cd apps/web && npm run build && npx gh-pages -d dist

# 部署推播伺服器到 Vercel
cd push-server && npx vercel --prod

# 型別檢查
npx tsc -b apps/web

# 本機開發
npm run dev              # 前端，開在 localhost:5173
```

## 已知的限制、沒做的事

- **推播的「已讀確認」等級很陽春**：只是把 FCM 訊息送出去就算數，沒有做「使用者真的看到了嗎」的追蹤機制。
- **Firestore 資料不會自動清理**：過期邀請碼、已取消/婉拒的行程都是軟刪除，永遠留在資料庫裡。以兩人使用的規模完全不會碰到免費額度上限，沒有實作清理機制。
- **`APP_SECRET` 嚴格來說不是真正的機密**：它同時存在前端 `.env`（會被打包進公開 JS）跟 Vercel 環境變數兩邊，因為前端需要它來「證明自己有權限呼叫」推播 API。對兩人私用的規模風險很低，但不是公開產品等級的安全設計。
- **沒有做 Google/Apple 行事曆真的串接**：`apps/api` 裡的 Prisma schema 有先留欄位（`CalendarConnection` 等），但完全沒有實作 OAuth 金鑰交換，這是刻意排除在範圍外的。
- **`apps/api` 是死程式碼**：留著但沒人在維護、沒有部署，如果之後要繼續往行事曆整合的方向做，需要重新驗證這塊還能不能動（套件版本可能過期）。

## 如果要換工具（例如 Codex）接手，建議先做的事

1. 讓新工具讀過這份文件、[`design-plan.md`](design-plan.md)、[`complete-tech-tutorial.md`](complete-tech-tutorial.md) 三份，建立起碼的背景知識
2. 確認新工具的執行環境能不能連得到 Firebase／Vercel／GitHub 的網域（不同工具的網路沙盒限制可能不一樣）
3. 把 `apps/web/.env` 的內容告訴新工具（或讓它自己去對應服務的 Console 查），因為這個檔案通常不會進 git、不會自動帶過去
