# TimeTide 技術全解析：從零開始的完整教學

> 這份文件的目標：就算你完全沒寫過程式，看完也能理解這個 App 裡每一項技術「是什麼」「為什麼需要它」「在這個專案裡具體做了什麼」。看到專有名詞時，文中都會用白話拆解。

---

## 目錄

1. [大架構總覽：資料怎麼流動](#1-大架構總覽資料怎麼流動)
2. [前端基礎：React / TypeScript / Vite](#2-前端基礎react--typescript--vite)
3. [狀態管理：Zustand](#3-狀態管理zustand)
4. [本機儲存：IndexedDB](#4-本機儲存indexeddb)
5. [時間處理：Luxon](#5-時間處理luxon)
6. [PWA 是什麼：讓網頁變成「App」](#6-pwa-是什麼讓網頁變成app)
7. [Service Worker：背景執行的隱形程式](#7-service-worker背景執行的隱形程式)
8. [Firebase 全家桶](#8-firebase-全家桶)
9. [Firestore 資料庫設計細節](#9-firestore-資料庫設計細節)
10. [Firestore 安全規則（Security Rules）](#10-firestore-安全規則security-rules)
11. [推播通知的完整原理](#11-推播通知的完整原理)
12. [後端：Vercel Serverless Functions](#12-後端vercel-serverless-functions)
13. [定時任務：Cron](#13-定時任務cron)
14. [部署：GitHub Pages 與 Vercel](#14-部署github-pages-與-vercel)
15. [環境變數與機密管理](#15-環境變數與機密管理)
16. [完整生命週期：一次約會的完整故事](#16-完整生命週期一次約會的完整故事)
17. [名詞小辭典](#17-名詞小辭典)

---

## 1. 大架構總覽：資料怎麼流動

這個 App 叫 **TimeTide**，給分隔兩地、有時差的兩個人用，核心功能是：
- 一條時間軸，同時顯示雙方的當地時間
- 兩人可以配對，一起約時間、互相收到通知

整個系統由五塊拼起來：

```
┌─────────────────┐         ┌──────────────────┐
│  你的手機 (瀏覽器)  │ ←──────→ │     Firebase      │
│  React App        │  即時同步  │  (Firestore 資料庫 │
│  (GitHub Pages)    │         │   + 帳號系統)      │
└─────────────────┘         └──────────────────┘
        │                              ▲
        │ 建立/確認/刪除行程時          │ 讀取對方的
        │ 順便呼叫                     │ 裝置 token
        ▼                              │
┌─────────────────┐         ┌──────────────────┐
│  Vercel 伺服器     │────────→│  Google FCM 服務   │
│  (push-server)     │  發送推播 │  (負責把通知真的    │
│                    │         │   送到手機上)       │
└─────────────────┘         └──────────────────┘
        ▲
        │ 每 5 分鐘呼叫一次
        │ 「有沒有行程快到了？」
┌─────────────────┐
│  cron-job.org      │
│  (外部排程服務)     │
└─────────────────┘
```

**白話翻譯**：
- 你手機上看到的畫面，是一個網頁 App，放在 GitHub Pages（免費的網頁主機服務）
- 這個 App 會直接跟 Google 的 Firebase 服務對話，讀寫資料、確認身份
- 當有事情發生（例如對方提議了一個時間），App 會另外打一通「電話」給我們自己架的一個小伺服器（放在 Vercel），請它去跟 Google 的推播系統（FCM）說「幫我通知另一支手機」
- 因為「檢查行程快到了沒」這件事沒辦法用「有人做動作才觸發」的方式做，所以另外找了一個外部的定時服務（cron-job.org）每隔幾分鐘去戳一下我們的伺服器，問它「該提醒了嗎？」

---

## 2. 前端基礎：React / TypeScript / Vite

### 2.1 什麼是「前端」

「前端」指的是使用者眼睛看得到、手指點得到的那一層——你手機螢幕上顯示的畫面、按鈕、動畫，全部都是前端。跟它相對的是「後端」，是使用者看不到、在伺服器上默默運作的程式（例如負責發推播的 `push-server`）。

### 2.2 React：用「元件」拼畫面

**React** 是一個用來寫網頁畫面的函式庫（library，別人寫好、你拿來用的一堆程式碼）。核心概念是：**把畫面拆成一塊一塊的「元件」（Component），每一塊自己管自己的邏輯，最後像積木一樣拼起來**。

舉例，這個 App 的 [TimelineScreen.tsx](../apps/web/src/screens/TimelineScreen.tsx) 就是「整個時間軸畫面」這個元件，裡面又包了很多小元件：
- [TimelineToolbar.tsx](../apps/web/src/components/timeline/TimelineToolbar.tsx)：最上面那條工具列（配對圖示、夜晚設定、「現在」按鈕）
- [DualRailViewport.tsx](../apps/web/src/components/timeline/DualRailViewport.tsx)：中間那個可以滑動的雙軌時間軸
- [PairingSheet.tsx](../apps/web/src/components/pairing/PairingSheet.tsx)：點配對圖示跳出來的那個面板

每個元件本質上就是一個 **函式（function）**，接收一些「參數」（React 裡叫 **props**），回傳「畫面長什麼樣子」。例如：

```tsx
function TimelineToolbar({ onJumpToNow, paired }: { onJumpToNow: () => void; paired: boolean }) {
  return (
    <div>
      <button onClick={onJumpToNow}>現在</button>
      {paired && <span>已配對</span>}
    </div>
  );
}
```

- `{ onJumpToNow, paired }` 就是這個元件收到的參數（外面的人告訴它「按下去要做什麼」、「現在配對了沒」）
- `return (...)` 裡面那段長得像 HTML 的東西叫 **JSX**——它不是真的 HTML，是 React 特有的語法，讓你可以「用寫 HTML 的方式描述畫面」，React 會在背後把它轉換成真正的網頁元素
- `{paired && <span>已配對</span>}` 是 JSX 裡常見的寫法：如果 `paired` 是 `true`，就顯示後面那個 `<span>`，否則什麼都不顯示

### 2.3 Hooks：元件的「記憶」和「反應能力」

React 元件預設是「沒有記憶的」——每次畫面重新畫，裡面的變數就歸零。但很多時候你需要元件「記住」一些東西（例如使用者輸入的文字、現在時間軸捲到哪裡），這時候要用 **Hook**（鉤子）。

最常用的兩個：

**`useState`**：讓元件擁有「可以改變、且改變後畫面會自動更新」的變數。

```tsx
const [busy, setBusy] = useState(false);
```

這行的意思是：「宣告一個叫 `busy` 的狀態，初始值是 `false`；`setBusy` 是用來改變它的函式」。當你呼叫 `setBusy(true)`，React 會自動重新畫面上所有用到 `busy` 的地方——這就是為什麼按下「送出提議」按鈕後，文字會自動從「送出提議」變成「送出中…」（[CreateMeetingSheet.tsx](../apps/web/src/components/pairing/CreateMeetingSheet.tsx) 裡就是這樣寫的）。

**`useEffect`**：讓元件在「某個時機點」自動執行一段程式碼，最常見的時機是「元件第一次出現在畫面上的時候」。

```tsx
useEffect(() => {
  void hydratePairing();
}, [hydratePairing]);
```

這段的意思：「當這個元件出現、或是 `hydratePairing` 這個東西改變的時候，就跑一次裡面的程式碼」。這裡用來做「App 一打開，就去檢查有沒有已經配對過的資料」（[TimelineScreen.tsx](../apps/web/src/screens/TimelineScreen.tsx)）。

### 2.4 TypeScript：加了「型別」的 JavaScript

**JavaScript** 是網頁世界的程式語言，瀏覽器唯一看得懂的語言。但 JavaScript 有個問題：它不會檢查你的變數「應該是什麼型態」。例如你以為某個變數是數字，結果它其實是文字，程式要跑到那一行才會爆炸，而且錯誤訊息常常很難懂。

**TypeScript** 是 JavaScript 的「加強版」：你可以幫變數、函式標註「型別」（這是數字、這是文字、這是一個有 `id` 跟 `name` 兩個欄位的物件⋯），寫程式的當下（甚至還沒執行）編輯器就會告訴你哪裡型別對不上，減少很多低級錯誤。TypeScript 寫完之後，會被「編譯」成純 JavaScript 給瀏覽器執行（瀏覽器看不懂 TypeScript）。

這個專案裡到處都是型別定義，例如 [pairing.ts](../apps/web/src/lib/pairing.ts) 裡：

```ts
export interface MeetingData {
  startAt: string;
  endAt: string;
  title?: string;
  status: "proposed" | "confirmed" | "declined" | "cancelled";
}
```

`interface` 就是在定義「一個行程資料長什麼樣子」：一定要有 `startAt`（開始時間，文字型態）、`endAt`；`title?` 的問號代表「這個欄位可以不填」；`status` 則規定只能是那四個字串的其中一個，打錯字（例如打成 `"confirm"` 少一個 d）編輯器立刻會標紅線。這在多人協作或專案很大時特別有用，因為你不用每次都跑去翻資料庫才知道欄位長怎樣。

### 2.5 Vite：開發時的小幫手、打包工具

**Vite**（唸作 "veet"，法文「快」的意思）負責兩件事：

1. **開發階段**：你改程式碼存檔，畫面立刻更新（不用手動重新整理），這叫 **Hot Module Replacement**（模組熱替換）。跑 `npm run dev` 啟動的那個「開發伺服器」就是 Vite 在管。
2. **正式上線階段**：跑 `npm run build` 的時候，Vite 會把你寫的一大堆 `.tsx`／`.ts`／`.css` 檔案，全部「打包」成瀏覽器真正看得懂、載入速度快的少數幾個 `.js`／`.css` 檔案（這個過程叫 **bundling**，打包）。這些打包好的檔案會放進 `dist/` 資料夾，之後就是把這個資料夾整包丟上 GitHub Pages。

專案設定檔 [vite.config.ts](../apps/web/vite.config.ts) 就是在告訴 Vite「怎麼打包」「PWA 相關設定」等等。

### 2.6 Tailwind CSS：用「類別名稱」直接寫樣式

一般寫網頁樣式（CSS）要另外開一個檔案，寫「這個 class 要什麼顏色、多寬」。**Tailwind CSS** 換一種做法：直接在 HTML／JSX 上面貼一堆預先定義好的小類別名稱，例如：

```tsx
<div className="flex items-center px-3 rounded-full">
```

- `flex`：這個容器裡的內容要「橫向排列」
- `items-center`：垂直置中
- `px-3`：左右各留一點內距
- `rounded-full`：把角完全變圓（做出膠囊形狀）

好處是不用一直切換檔案、也不用自己想 class 名稱怎麼取。

---

## 3. 狀態管理：Zustand

隨著 App 變複雜，很多「資料」需要被很多不同、彼此沒有直接關係的元件同時用到（例如「現在有沒有配對成功」這件事，工具列、行程建立畫面、行程詳情畫面都要知道）。如果每次都要一層一層把資料從最上面的元件往下傳，會非常麻煩，這叫 **prop drilling**（參數鑽孔，戲稱資料要鑽過一堆不相干的中間層）。

**Zustand**（德文「狀態」的意思）是一個「全域狀態管理」工具：把共用的資料跟修改資料的函式，集中寫在一個地方（這個專案裡是 [usePairingStore.ts](../apps/web/src/state/usePairingStore.ts) 跟 [useTimelineStore.ts](../apps/web/src/state/useTimelineStore.ts)），任何元件都可以直接「訂閱」它想要的那一小塊資料，不用管資料是從哪裡傳過來的。

```ts
export const usePairingStore = create<PairingState>((set, get) => ({
  pairingId: null,
  memberUids: [],
  async createMeeting(meeting) { /* ... */ },
}));
```

任何元件裡只要寫：

```ts
const memberUids = usePairingStore((s) => s.memberUids);
```

就能拿到最新的 `memberUids`，而且只要這個值一變，用到它的元件會自動重新畫面，不用手動通知。

---

## 4. 本機儲存：IndexedDB

Firestore 存的是「雲端」的資料，需要網路才能讀取。但有些資料我們希望「就算沒網路、App 剛打開還沒連上 Firebase」也能立刻拿到，例如「我上次設定的自己時區是哪裡」「我已經跟誰配對過了」。

**IndexedDB** 是瀏覽器內建的「本機資料庫」，資料存在使用者的手機／電腦上，不會因為關掉 App、重開機而消失（跟網頁常見的 `localStorage`類似但功能更完整，適合存比較大量、有結構的資料）。

直接操作 IndexedDB 的原生 API 寫起來很囉唆，所以這個專案用了一個叫 **`idb`** 的小函式庫幫忙包裝，讓語法變得比較簡單易讀（看 [db.ts](../apps/web/src/lib/db.ts)）：

```ts
export async function loadPairingId(): Promise<string | null> {
  const db = await getDB();
  const existing = await db.get("settings", "pairing");
  return existing && "pairingId" in existing ? existing.pairingId : null;
}
```

這段程式碼負責「打開本機資料庫、去 `settings` 這個表格裡找 `pairing` 這筆資料、把裡面的 `pairingId` 拿出來」。這就是為什麼你關掉 App 重開，不用重新配對一次的原因——配對的 ID 存在你手機的 IndexedDB 裡。

---

## 5. 時間處理：Luxon

處理「時間」和「時區」是程式設計裡出了名的麻煩事：不同時區的時差、日光節約時間、換日的邊界⋯全部都很容易出錯。**Luxon** 是一個專門處理日期時間的函式庫，這個 App 大量依賴它做時區換算。

核心概念：

- **絕對時刻**：宇宙中「這一刻」是唯一的，不管你在哪個時區，這一刻就是那一刻。程式內部都用 **UTC**（世界協調時間，一個全球共用、不受時區影響的時間基準）存資料，例如 Firestore 裡 `startAt` 存的都是像 `"2026-09-10T07:00:00.000Z"` 這種格式（最後那個 `Z` 就是代表「這是 UTC 時間」）。
- **顯示時刻**：畫面上要顯示給人看的時候，才把這個絕對時刻「轉換」成使用者所在時區的當地時間，例如台北是 UTC+8，同一個絕對時刻在台北顯示出來就會是 15:00。

```ts
DateTime.fromISO(meeting.startAt).toLocal().toFormat("yyyy/MM/dd HH:mm")
```

這行的意思：「把存起來的 ISO 格式時間字串解析成一個時間物件 → 轉換成使用者裝置所在的當地時區 → 格式化成『年/月/日 時:分』的樣子顯示出來」。

---

## 6. PWA 是什麼：讓網頁變成「App」

**PWA**（Progressive Web App，漸進式網頁應用程式）不是一種新技術，而是一套「讓網頁盡量表現得像原生 App」的標準跟慣例做法，主要靠三樣東西：

1. **HTTPS**：網頁必須是加密連線（網址開頭 `https://`），這是 PWA 的硬性要求
2. **Web App Manifest**：一個叫 `manifest.webmanifest` 的設定檔，告訴瀏覽器這個網頁「叫什麼名字」「圖示長怎樣」「加到主畫面後要用全螢幕（`standalone`）模式打開，不要顯示瀏覽器網址列」。這個專案裡的設定寫在 [vite.config.ts](../apps/web/vite.config.ts) 的 `manifest` 那一段
3. **Service Worker**：見下一節

當這三樣都到位，手機瀏覽器（例如 iPhone 的 Safari）就會允許使用者「加入主畫面」，圖示會出現在桌面上，看起來、用起來都跟一個真的 App 沒兩樣——但背後其實整個都還是網頁技術。

**為什麼不乾脆做「真的」App？** 原生 App 要分別學 iOS（Swift）跟 Android（Kotlin）兩套完全不同的技術、要上架 App Store／Google Play（審核、年費），而 PWA 用同一套網頁技術就能同時涵蓋所有平台，開發成本低很多，對這種個人小專案特別划算。

---

## 7. Service Worker：背景執行的隱形程式

**Service Worker** 是這個 App 裡最關鍵、也最難懂的一塊技術，值得花點篇幅講清楚。

### 7.1 它是什麼

Service Worker 是瀏覽器允許網頁「安裝」一段特殊 JavaScript 程式碼，這段程式碼**不是在你看到的網頁畫面裡執行，而是在瀏覽器背景一個獨立的執行環境裡跑**，就算你把分頁關掉，它有時候還是能繼續運作。它像是一個「介於瀏覽器和網路之間的代理人」。

Service Worker 能做兩件這個專案很依賴的事：

1. **離線快取**：把網頁的檔案先存起來，下次打開就算沒網路也能顯示（雖然這個 App 主要功能需要網路，但基本畫面骨架可以快取）
2. **接收推播、顯示系統通知**：就算網頁分頁/App 完全沒開著，Service Worker 依然能收到「有推播來了」的事件，然後叫瀏覽器跳出系統層級的通知橫幅

### 7.2 這個專案怎麼用它

Service Worker 的原始碼寫在 [sw.ts](../apps/web/src/sw.ts)。它做兩件事：

```ts
precacheAndRoute(self.__WB_MANIFEST);
```

這行是「離線快取」的部分，用了一個叫 **Workbox**（Google 出的 Service Worker 工具庫，`precacheAndRoute` 是它的函式）的東西，把打包出來的所有檔案清單（`self.__WB_MANIFEST`，這個特殊變數在打包時會自動被 Vite 換成真正的檔案清單）都先存進瀏覽器的快取。

```ts
onBackgroundMessage(messaging, (payload) => {
  self.registration.showNotification(payload.data?.title ?? "TimeTide", { body: payload.data?.body ?? "" });
});
```

這段是「收到推播」的部分：當 Firebase 的推播訊息傳來、而且使用者當下沒有正在看這個 App（在背景），這段程式碼就會被觸發，呼叫瀏覽器的 `showNotification`（顯示系統通知）API。

### 7.3 為什麼要切換成 `injectManifest` 模式

`vite-plugin-pwa` 這個工具原本預設用 `generateSW` 模式，意思是「全部自動幫你產生一個 Service Worker，你不用自己寫」。但這個自動產生的版本裡沒有「處理 Firebase 推播」的程式碼——我們需要自己客製化 Service Worker 的內容，所以改成 `injectManifest` 模式：意思是「我自己提供 Service Worker 的原始檔（`sw.ts`），你（工具）只負責把離線快取需要的檔案清單『注入』進我寫的檔案裡就好」。這樣我們才能在同一個 Service Worker 裡，同時處理離線快取跟推播兩件事。

---

## 8. Firebase 全家桶

**Firebase** 是 Google 提供的一整套「後端即服務」（Backend-as-a-Service，簡稱 BaaS）平台——意思是很多原本要自己架伺服器才能做的事（資料庫、帳號系統、推播），Firebase 都幫你做好了，你只要在前端呼叫它的 SDK（軟體開發套件，Software Development Kit，就是別人幫你把複雜操作包成好呼叫的函式庫）就好，完全不用自己維護一台伺服器。這個專案用了 Firebase 的三個服務：

### 8.1 Firebase Authentication（帳號系統）——用「匿名登入」

一般網站的「登入」需要帳號密碼、或是用 Google／Facebook 帳號登入。這個 App 用的是 **匿名登入**（Anonymous Authentication）：使用者完全不用輸入任何東西，App 一開啟就自動偷偷跟 Firebase 說「幫我開一個新的匿名身份」，Firebase 會給這個裝置一組獨一無二的 **UID**（User ID，使用者識別碼，一長串英數字），之後這個裝置做的所有事情（配對、建立行程）都用這組 UID 來識別「是誰做的」。

看 [firebase.ts](../apps/web/src/lib/firebase.ts)：

```ts
export function getUid(): Promise<string> {
  if (!uidPromise) {
    uidPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) { unsubscribe(); resolve(user.uid); }
      }, reject);
      if (!auth.currentUser) signInAnonymously(auth).catch(reject);
    });
  }
  return uidPromise;
}
```

`signInAnonymously` 就是「跟 Firebase 要一個匿名身份」的函式。`onAuthStateChanged` 是「監聽登入狀態變化」，一旦拿到使用者物件，就把裡面的 `uid` 回傳出去。

**匿名登入的取捨**：好處是使用者完全無感、不用註冊；缺點是如果使用者清除瀏覽器資料，或換一台裝置，這個匿名身份就消失了、資料就對不上了（這也是為什麼之前設計「解除配對重新配對」的原因——換裝置基本上等於變成一個新的匿名使用者，需要用邀請碼重新綁在一起）。

### 8.2 Firestore（資料庫）

見下一節，獨立詳細講。

### 8.3 Firebase Cloud Messaging（FCM，推播服務）

見「推播通知的完整原理」那一節。

---

## 9. Firestore 資料庫設計細節

### 9.1 什麼是「文件資料庫」

一般人比較熟悉的資料庫概念是 Excel 表格：一列一列、每一列有固定的欄位。**Firestore** 是一種 **NoSQL 文件資料庫**（NoSQL 泛指「不是傳統表格式」的資料庫），基本單位不是「列」，而是 **文件（Document）**——每份文件就像一個 JSON 物件，欄位可以自由增減，不同文件甚至可以長得不一樣。文件被放在 **集合（Collection）** 裡（有點像資料夾），集合底下也可以再放 **子集合（Subcollection）**，一層一層像資料夾套資料夾。

這個 App 的資料結構長這樣：

```
users/{uid}                          ← 每個裝置一份文件
  { pairingId, fcmToken }

pairings/{pairingId}                 ← 每組配對一份文件
  { memberUids: [uidA, uidB] }

  meetings/{meetingId}               ← 子集合：這組配對底下的所有行程
    { startAt, endAt, title, status, proposedByUid, reminderMinutesBefore, reminderSent }

invites/{code}                       ← 邀請碼
  { pairingId, creatorUid, expiresAt, redeemed }
```

`{uid}`、`{pairingId}` 這種用大括號包起來的，代表「這裡是一個變動的識別碼，不是固定文字」——`users/{uid}` 的意思是「`users` 這個集合底下，有很多份文件，每一份的名字就是那個使用者的 uid」。

### 9.2 即時同步：`onSnapshot`

Firestore 最強大的功能是 **即時監聽**：你可以「訂閱」一份文件或一個集合，只要雲端資料一有變動（不管是誰改的），所有正在訂閱的裝置都會**立刻**收到最新的資料，不用自己一直傳統的「每隔幾秒問一次伺服器有沒有新資料」（這種土法煉鋼的作法叫 **polling**，輪詢）。

```ts
export function subscribeToMeetings(pairingId: string, cb: (meetings: MeetingWithId[]) => void) {
  const meetingsQuery = query(collection(db, "pairings", pairingId, "meetings"), orderBy("startAt"));
  return onSnapshot(meetingsQuery, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as MeetingData) })));
  });
}
```

這就是為什麼 A 建立一個行程後，B 完全不用重新整理頁面，畫面就自動跳出新的提案——B 的 App 一直「開著一條線」盯著這個資料，Firestore 主動把新資料推過來。

### 9.3 Collection Group Query（跨集合查詢）

一般查詢是「查某一個特定路徑底下的集合」，例如「查這一組配對底下的所有行程」。但「提醒推播」那支程式需要做的事是：「查**所有**配對、**所有** `meetings` 子集合裡，符合條件的行程」——不管它是屬於哪一組配對。這種「跨越所有同名子集合去查」的查詢方式叫 **Collection Group Query**：

```ts
db.collectionGroup("meetings").where("status", "==", "confirmed").where("reminderSent", "==", false)
```

因為這種查詢牽涉到「同時比對兩個欄位、又是跨集合」，Firestore 要求你事先手動建立一個 **複合索引（Composite Index）**——「索引」的概念跟書本後面的「索引」很像：如果沒有索引，資料庫每次查詢都要把所有資料整個翻過一遍才能找到符合的（很慢），有了索引，資料庫可以直接跳到對的地方找，但代價是需要額外空間存這個索引、而且要先手動設定它要「針對哪些欄位」建。這也是我們之前卡關的那個 `FAILED_PRECONDITION` 錯誤的原因——查詢用到的索引還沒建好。

---

## 10. Firestore 安全規則（Security Rules）

### 10.1 為什麼需要它

前端程式碼（你寫的 `.ts`／`.tsx` 檔案）**打包完之後，是完全公開、任何人都能下載下來看內容的**——這是所有網頁前端的宿命，因為瀏覽器就是要能讀懂這些程式碼才能執行。所以「前端程式碼裡有沒有寫檢查」完全不能當作安全防線，**任何人都可以繞過你的網頁介面，直接拿你的 Firebase 專案設定，自己寫程式去呼叫 Firestore**。

真正的防線是 **Firestore Security Rules**——這是一份寫在 Firebase 伺服器端、前端完全碰不到也改不了的規則檔案，規定「誰可以讀/寫哪些資料、在什麼條件下」。不管請求是從你的網頁來的，還是駭客自己寫的程式來的，Firestore 都會先檢查這份規則，不符合就直接拒絕，資料庫本身不會被繞過。

### 10.2 這個專案的規則邏輯

```
match /pairings/{pairingId} {
  allow read: if request.auth != null && (
    request.auth.uid in resource.data.memberUids ||
    resource.data.memberUids.size() < 2
  );
  ...
}
```

拆解這段：
- `match /pairings/{pairingId}` — 這條規則套用在「pairings 集合底下的任何一份文件」
- `request.auth != null` — 一定要是登入狀態（包含匿名登入也算）才行，完全沒登入的請求一律擋掉
- `request.auth.uid in resource.data.memberUids` — 如果你的 uid 已經在這份配對文件的成員名單裡，可以讀
- `|| resource.data.memberUids.size() < 2` — **或者**，如果這組配對目前成員數不到 2 人（代表還沒配對完成，正在等人加入），任何登入者都可以讀——這是刻意放寬的，因為要加入配對的人，得先能「讀到」這份文件才能檢查「還有沒有空位」

這種規則設計的心法是：**預設全部拒絕，只開放明確需要的最小權限**。這份專案因為只給兩人私下使用，規則寫得比公開商用產品寬鬆一些（例如沒有做到完整的邀請碼加密驗證），但核心資料（配對成立後的內容）還是鎖得住。

---

## 11. 推播通知的完整原理

這是整個專案裡最多環節、也最容易搞混的部分，拆成一步一步講。

### 11.1 為什麼「發送」推播一定要有伺服器

瀏覽器的安全機制設計成：**任何網頁都不能直接把訊息塞進另一個人的手機裡**，一定要透過一個「大家都信任的中間人」——也就是 Google 的 **FCM（Firebase Cloud Messaging）** 服務。而「請 FCM 幫忙送」這個動作，需要出示一把只有「該專案擁有者」才有的鑰匙（**服務帳戶金鑰**），這把鑰匙絕對不能放在前端（放前端 = 全世界都看得到），所以一定要有一台「伺服器」握著這把鑰匙，代替你去跟 FCM 講話。這就是為什麼即使前面都用 Firebase 做到不用自架伺服器，推播這一塊還是得另外生出一個小伺服器（`push-server`）。

### 11.2 完整流程六步驟

1. **使用者按下「開啟推播通知」** → 瀏覽器跳出系統權限詢問（「TimeTide 想要傳送通知給你」）→ 使用者按允許
2. **瀏覽器發一組「裝置通行證」**（**FCM Token**，一長串加密字串，代表「這台裝置、這個 App」）給我們的前端程式碼（[push.ts](../apps/web/src/lib/push.ts) 的 `getToken()`）
3. **前端把這組 token 存進 Firestore**（`users/{uid}.fcmToken`），這樣之後任何知道這個 uid 的人（也就是我們自己的伺服器）都能查到「要把推播送去哪裡」
4. **使用者操作**（建立/確認/刪除行程）→ 前端一邊寫 Firestore，一邊順便打一通 HTTP 請求給 [push-server/api/notify.ts](../push-server/api/notify.ts)，附上「要通知誰、標題、內容」
5. **`notify.ts` 用服務帳戶金鑰**，向 Firestore 查出對方的 token，再呼叫 FCM 的發送 API
6. **FCM 把訊息送到對方裝置的 Service Worker**（[sw.ts](../apps/web/src/sw.ts)）→ Service Worker 呼叫瀏覽器的通知 API，跳出系統通知

### 11.3 VAPID Key 是什麼

**VAPID**（Voluntary Application Server Identification，直譯「應用伺服器自願識別」）是 Web Push 標準的一部分：瀏覽器要求「想推播的人」證明自己的身份，VAPID key 就是這個「身份證明」的公開金鑰。跟服務帳戶金鑰不一樣的地方是：**VAPID 的公開金鑰本來就設計成可以放在前端**（它只是拿來「申請訂閱」的，不是拿來「發送」的），所以我們的 `.env` 裡的 `VITE_FIREBASE_VAPID_KEY` 沒有安全疑慮。

### 11.4 為什麼一開始重複跳兩次通知

FCM 傳送的訊息可以帶兩種資料：`notification`（通知型）跟 `data`（純資料型）。如果訊息裡有 `notification` 欄位，瀏覽器會**自動**跳出一個通知；但我們的 [sw.ts](../apps/web/src/sw.ts) 裡又**手動**呼叫了一次 `showNotification()`，兩邊都跳，就變成重複兩次。解法是把訊息全部改成 `data` 格式（純資料，瀏覽器不會自動顯示），完全交給我們自己的程式碼決定「什麼時候、要不要跳通知」。

---

## 12. 後端：Vercel Serverless Functions

### 12.1 什麼是「Serverless」

字面上「無伺服器」容易誤會，其實伺服器當然還是存在，只是**你不用自己管理它**：不用租一台主機、不用煩惱它會不會當機、流量大要不要擴充機器。你只要寫一個函式（一段程式碼），上傳給 Vercel 這種平台，平台會在「有人真的呼叫這支 API 的那一瞬間」才幫你啟動一個極短暫的執行環境去跑這段程式碼，跑完馬上關掉。你只需要為「真的被呼叫的次數」付費（在免費額度內完全不用錢）。

### 12.2 這個專案的兩支 Serverless Function

放在 [push-server/api/](../push-server/api/) 資料夾裡的每一個 `.ts` 檔案，Vercel 都會自動把它變成一支獨立的網址 API：

- [notify.ts](../push-server/api/notify.ts) → `https://push-server-lovat.vercel.app/api/notify`：收到「請通知某人」的請求，去發推播
- [check-reminders.ts](../push-server/api/check-reminders.ts) → `https://push-server-lovat.vercel.app/api/check-reminders`：被排程呼叫，檢查有沒有行程快到了

### 12.3 firebase-admin SDK

前端用的是 `firebase/app`、`firebase/firestore` 這些「客戶端 SDK」，權限受 Security Rules 限制。伺服器端用的是完全不同的一套：**`firebase-admin`**，這是給「後端、被信任的環境」用的管理員權限 SDK——只要有服務帳戶金鑰，就能完全繞過 Security Rules、讀寫任何資料。這就是為什麼 `notify.ts` 能讀到 `users/{recipientUid}` 的 token，即使一般前端的規則不允許你讀別人的 `users` 文件。

---

## 13. 定時任務：Cron

### 13.1 Cron 是什麼

**Cron** 是電腦科學裡「定期自動執行某件事」的通稱，名字來自很多年前 Unix 系統上的一個排程程式。描述「多久跑一次」常用一種叫 **Cron 表達式** 的格式，五個欄位分別代表分、時、日、月、星期，例如 `*/5 * * * *` 就是「每 5 分鐘跑一次」。

### 13.2 為什麼不能直接用 Vercel 自己的排程

Vercel 本身也提供 Cron 功能，但**免費方案一天只能跑一次**，而且時間點不精準（可能落在整個小時內的任何時刻），完全不夠「提醒行程」這種需要抓緊時間的用途。

### 13.3 用外部服務補位

**API 端點本質上就是一個「誰都可以打的網址」**，不一定要靠 Vercel 自己的排程系統去呼叫它——任何東西，只要能在對的時間發出 HTTP 請求，都能觸發它執行。**cron-job.org** 就是一個專門做這件事的免費服務：你告訴它「每 5 分鐘幫我打一次這個網址」，它就會準時去打，完全不用信用卡、不用寫任何程式碼。這是「用免費資源拼湊出原本要付費才有的功能」的典型例子。

---

## 14. 部署：GitHub Pages 與 Vercel

### 14.1 GitHub Pages

**GitHub** 是存放程式碼的雲端平台（版本控制系統 **Git** 的雲端服務），**GitHub Pages** 是 GitHub 附贈的一個功能：可以把你 repo（專案倉庫）裡的靜態檔案（打包好的 HTML/CSS/JS）直接變成一個公開網站，網址格式是 `https://你的帳號.github.io/專案名稱/`。因為這個 App 打包出來就是純靜態檔案（沒有需要自己跑程式的後端邏輯），非常適合放這裡，而且完全免費。

部署的實際動作是靠一個叫 **`gh-pages`** 的 npm 套件：`npx gh-pages -d dist` 這行指令會把 `dist/` 資料夾（Vite build 出來的成品）整包推到一個叫 `gh-pages` 的特殊分支上，GitHub 看到這個分支就會自動把內容發布成網站。

### 14.2 Vercel

**Vercel** 是專門做「前端＋Serverless Function」部署的平台，這個專案拿它來放 `push-server`（因為那需要真的執行程式碼的能力，GitHub Pages 做不到）。用 `npx vercel` 指令部署時，它會把 `api/` 資料夾底下每個檔案自動變成一支 Serverless Function。

---

## 15. 環境變數與機密管理

### 15.1 什麼是環境變數

**環境變數**（Environment Variable）是「跟程式碼本身分開存放的設定值」，最常見的用途就是放「機密資訊」（金鑰、密碼）或是「不同環境會不一樣的設定」（開發用測試資料庫、正式上線用正式資料庫）。這樣做的好處是：程式碼本身不用寫死任何機密值，可以放心地公開分享程式碼（例如放上 GitHub），只有真正執行的那個環境（你自己的電腦、Vercel 的伺服器）才知道實際的值是什麼。

### 15.2 這個專案的兩種環境變數，天差地遠的安全性

- **`apps/web/.env`（前端）**：Vite 有個規則——只有開頭是 `VITE_` 的變數，才會被打包進最終的 JS 檔案裡。**這代表這些值全部都是公開的**，任何人打開瀏覽器開發者工具都看得到。這也是為什麼 Firebase 的 `apiKey` 可以放心寫在這裡——Firebase 的設計本來就預期這組值是公開的，真正的防線是 Security Rules，不是隱藏這組 key。
- **Vercel 專案設定裡的環境變數（後端）**：像 `FIREBASE_SERVICE_ACCOUNT`、`APP_SECRET`，這些**只存在 Vercel 的伺服器上，永遠不會被送到使用者的瀏覽器**，這才是真正意義上的「機密」。

一個常見的新手陷阱就是搞混這兩種——把該放後端的機密，誤放進前端的 `VITE_` 開頭變數裡，等於直接公開給全世界看。這個專案的 `APP_SECRET` 嚴格來說有一點點踩到這條線（它同時存在前端 `.env` 和 Vercel 兩邊，因為前端需要它來「證明自己有權限呼叫」），但因為風險很低（兩人私用、攻擊者要另外知道對方的 uid 才有意義），是可以接受的取捨。

---

## 16. 完整生命週期：一次約會的完整故事

把前面所有片段串成一個完整故事，假設 A 想約 B 講電話：

1. A 打開 App，[firebase.ts](../apps/web/src/lib/firebase.ts) 的 `signInAnonymously` 早已在背景默默完成匿名登入，A 的裝置有了一組 uid
2. A 點時間軸某一格，[DualRailViewport.tsx](../apps/web/src/components/timeline/DualRailViewport.tsx) 算出那一格代表的絕對時刻，打開 [CreateMeetingSheet.tsx](../apps/web/src/components/pairing/CreateMeetingSheet.tsx)
3. A 送出提議，[usePairingStore.ts](../apps/web/src/state/usePairingStore.ts) 的 `createMeeting` 被呼叫：
   - 先把行程寫進 Firestore 的 `pairings/{id}/meetings/{新meetingId}`，狀態是 `"proposed"`
   - 接著呼叫 [push.ts](../apps/web/src/lib/push.ts) 的 `sendPushNotification`，發 HTTP 請求給 Vercel 上的 `notify.ts`
4. `notify.ts` 查出 B 的 `fcmToken`，呼叫 FCM 送出訊息
5. B 的手機（不管 App 開不開著）Service Worker 收到訊息，跳出系統通知
6. 同時，因為 B 的 App 如果是開著的，Firestore 的 `onSnapshot` 監聽也會即時把新行程推給 B，[TimelineScreen.tsx](../apps/web/src/screens/TimelineScreen.tsx) 裡的自動彈窗邏輯偵測到「有新的、不是自己發的提議」，自動打開詳情視窗
7. B 按「接受」，狀態改成 `"confirmed"`，寫回 Firestore；同樣的推播流程再跑一次通知 A
8. 兩人的時間軸上，[MeetingBlock.tsx](../apps/web/src/components/timeline/MeetingBlock.tsx) 都畫出置中的金黃色膠囊，代表「雙方都同意的行程」
9. 每 5 分鐘，cron-job.org 打一次 [check-reminders.ts](../push-server/api/check-reminders.ts)，它掃過所有 `"confirmed"` 且還沒提醒過的行程，發現這筆快到了，發推播提醒雙方，然後把 `reminderSent` 標記成 `true`，之後就不會重複提醒

---

## 17. 名詞小辭典

| 名詞 | 白話解釋 |
|---|---|
| API | Application Programming Interface，「應用程式介面」，簡單說就是「一份規格書，告訴你要怎麼跟某個系統要資料/請它做事」 |
| SDK | Software Development Kit，別人幫你把複雜操作包裝成好呼叫的一組工具／函式庫 |
| UID | User ID，代表「這是誰」的一串獨一無二的識別碼 |
| Token | 一串代表某種「權限」或「身份」的字串，像一張通行證 |
| HTTPS | 加密過的網頁連線協定，防止傳輸內容被中途偷看竄改 |
| JSON | JavaScript Object Notation，一種用文字表示「結構化資料」的格式，長得像 `{"name": "test"}`，幾乎所有系統之間傳資料都用它 |
| NoSQL | 泛指不是傳統「表格列」形式儲存資料的資料庫，Firestore 是其中一種（文件型） |
| Collection / Document | Firestore 裡「資料夾」跟「檔案」的概念，Collection 裝很多 Document |
| Composite Index | 複合索引，資料庫為了加速「同時查多個條件」的查詢，事先建立的加速結構 |
| Security Rules | 寫在資料庫伺服器端、規定誰能讀寫什麼資料的規則，前端無法繞過 |
| Anonymous Auth | 匿名登入，不用帳密就能拿到一組獨一無二身份的登入方式 |
| Service Worker | 網頁可以「安裝」的一段背景執行程式，能做離線快取、接收推播等前台網頁做不到的事 |
| PWA | Progressive Web App，讓網頁具備類似原生 App 體驗（可加到主畫面、離線使用）的一套標準做法 |
| Manifest | 這裡指 Web App Manifest，描述「這個網頁 App 叫什麼名字、圖示長怎樣」的設定檔 |
| VAPID | Web Push 標準裡，證明「發送者身份」用的一組公開/私密金鑰機制 |
| FCM | Firebase Cloud Messaging，Google 提供的跨平台推播訊息服務 |
| Serverless | 「無伺服器」架構，你不用自己管理伺服器，平台按需求自動啟動/關閉執行環境 |
| 服務帳戶（Service Account） | 代表「一個程式/系統」（而不是一個真人）的特殊帳號，通常擁有較高的管理權限，用一把私密金鑰證明身份 |
| Cron / 排程 | 讓電腦「每隔固定時間自動做某件事」的機制 |
| 環境變數（Env Var） | 跟程式碼分開存放的設定值，常用來放機密資訊或依環境而異的設定 |
| Hook（React） | React 裡讓一般函式型元件也能擁有「記憶」「生命週期反應」等能力的特殊函式，例如 `useState`、`useEffect` |
| Props | React 元件從外部接收到的參數 |
| JSX | 一種可以在 JavaScript/TypeScript 裡直接寫「類 HTML」語法描述畫面的擴充語法，會被編譯成真正的畫面渲染邏輯 |
| Bundling（打包） | 把很多份原始程式碼檔案，合併/精簡成少數幾份瀏覽器能高效載入執行的檔案 |
| 匿名函式／回呼函式（Callback） | 當作參數傳給另一個函式、「等某件事發生了再執行」的函式，例如 `onSnapshot(query, (snap) => {...})` 裡的第二個參數 |
