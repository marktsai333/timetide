# TimeTide

雙人時差時間軸 PWA — 分隔兩地的兩個人，一眼看懂彼此的當地時間，之後可以約時間見面。

## 開發

```bash
npm install
npm run dev        # 啟動 apps/web (Vite)
npm run dev:api    # 啟動 apps/api (Fastify, 目前只是骨架)
```

## 結構

- `apps/web` — PWA 本體（React + TS + Vite + vite-plugin-pwa）
- `apps/api` — 帳號/配對/行事曆串接的後端骨架（Fastify + Prisma + SQLite），這次不接真的 OAuth
- `packages/shared` — 前後端共用的 zod schema

詳細規劃見 [docs/design-plan.md](docs/design-plan.md)。
