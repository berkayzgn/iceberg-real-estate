# Backend — Iceberg Estate API (NestJS) *(English)*

NestJS REST API for transactions, agents, commission breakdown, and reports. Full architecture, data model, and endpoint reference: **`docs/DESIGN.md`**. Monorepo root: **`README.md`**.

## Requirements

- **Node.js** 20+ (aligned with `.nvmrc` and `package.json` `engines`)
- **MongoDB** — [MongoDB Atlas](https://www.mongodb.com/atlas) required in production; local development may use Atlas or a local instance

## Setup

```bash
cd backend
cp -n .env.example .env
# .env: MONGODB_URI is required (Atlas connection string)
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development (watch), default port **3002** |
| `npm run build` | Build `dist/` (production build on Render, etc.) |
| `npm run start:prod` | `node dist/main` — use this in production |

- Global prefix: **`/api`** (e.g. `http://localhost:3002/api/health`)
- Port: `PORT` environment variable (default `3002`)

## Authentication

- **`POST /api/auth/login`** — body: `{ "email", "password" }`, response: `{ "accessToken" }`
- All other routes (except login and root meta): **`Authorization: Bearer <token>`**
- On first boot, if no user exists, one is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`UsersService`). See `docs/DESIGN.md` §8.

## Tests

```bash
npm test              # Jest unit tests (commission, stage transitions, reports; no Mongo required)
npm run test:e2e      # E2E — requires a running MongoDB
```

Per the technical case, unit tests are mandatory; coverage summary: `docs/DESIGN.md` §10.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | **Yes** | MongoDB connection string (Atlas recommended) |
| `JWT_SECRET` | **Yes in production** | Strong, unique signing key. If omitted in dev, a code default is used — **never in production** |
| `JWT_EXPIRES_SECONDS` | Optional | Token lifetime in seconds, default `604800` (7 days) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Recommended | Seeded panel user; change in production |
| `CORS_ORIGINS` | Optional | Comma-separated origins (e.g. Vercel root). If empty, local Nuxt ports `3000` / `3001` are allowed |
| `PORT` | Optional | Default `3002` |
| `NODE_ENV` | Optional | `development` / `production` |
| `SWAGGER_ENABLED` | Optional | Set `true` to expose `/api/docs` in production (otherwise Swagger is off) |

Template: **`.env.example`**.

## API & documentation

- **Health:** `GET /api/health`
- **Full route list & error keys:** `docs/DESIGN.md` (Appendix B, Appendix A)
- **Swagger:** open by default in development — `http://localhost:3002/api/docs`. In production only with `SWAGGER_ENABLED=true`.

## Production deployment (example: Render)

- Build: `npm ci && npm run build` (production may omit `devDependencies`; `@types/bcrypt` stays in `dependencies` for TypeScript compile)
- Start: `npm run start:prod` or `node dist/main`
- Set in the environment: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS` (frontend origin), strong `ADMIN_*`

Secrets are not stored in the repo; use host environment variables / secrets only.

---

# Backend — Iceberg Emlak API (NestJS)

NestJS tabanlı REST API: işlemler, danışmanlar, komisyon dökümü ve raporlar. Tüm mimari kararlar, veri modeli ve uç nokta özeti için **`docs/DESIGN.md`**. Monorepo kökü: **`README.md`**.

## Gereksinimler

- **Node.js** 20+ (`.nvmrc` ve `package.json` `engines` ile uyumlu)
- **MongoDB** — üretimde [MongoDB Atlas](https://www.mongodb.com/atlas) zorunlu; yerel geliştirme için Atlas veya yerel instance

## Kurulum

```bash
cd backend
cp -n .env.example .env
# .env: MONGODB_URI zorunlu (Atlas connection string)
npm install
```

## Çalıştırma

| Komut | Açıklama |
|-------|----------|
| `npm run start:dev` | Geliştirme (watch), varsayılan port **3002** |
| `npm run build` | `dist/` üretimi (Render vb. üretim build’i) |
| `npm run start:prod` | `node dist/main` — üretimde bu komut kullanılır |

- Global önek: **`/api`** (ör. `http://localhost:3002/api/health`)
- Port: `PORT` ortam değişkeni (varsayılan `3002`)

## Kimlik doğrulama

- **`POST /api/auth/login`** — gövde: `{ "email", "password" }`, yanıt: `{ "accessToken" }`
- Diğer uçlar (login ve kök meta hariç): **`Authorization: Bearer <token>`**
- İlk çalıştırmada `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile panel kullanıcısı yoksa oluşturulur (`UsersService`). Ayrıntı: `docs/DESIGN.md` §8.

## Test

```bash
npm test              # Jest birim testleri (komisyon, aşama geçişleri, raporlar; Mongo gerekmez)
npm run test:e2e      # E2E — çalışan bir MongoDB gerekir
```

Case gereği birim testler zorunludur; kapsam özeti `docs/DESIGN.md` §10.

## Ortam değişkenleri

| Değişken | Zorunluluk | Açıklama |
|----------|------------|----------|
| `MONGODB_URI` | **Zorunlu** | MongoDB connection string (Atlas önerilir) |
| `JWT_SECRET` | Üretimde **zorunlu** | Güçlü, benzersiz imza anahtarı. Geliştirmede boş bırakılırsa kod içi varsayılan kullanılır — **üretimde asla** |
| `JWT_EXPIRES_SECONDS` | Opsiyonel | Token ömrü (saniye), varsayılan `604800` (7 gün) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Önerilir | Seed edilen panel kullanıcısı; üretimde mutlaka değiştirin |
| `CORS_ORIGINS` | Opsiyonel | Virgülle ayrılmış origin listesi (örn. Vercel kökü). Boşsa yerel Nuxt portları (`3000` / `3001`) izinlidir |
| `PORT` | Opsiyonel | Varsayılan `3002` |
| `NODE_ENV` | Opsiyonel | `development` / `production` |
| `SWAGGER_ENABLED` | Opsiyonel | `production` ortamında `/api/docs` için `true` (aksi halde Swagger kapalı) |

Şablon: **`.env.example`**.

## API ve dokümantasyon

- **Sağlık:** `GET /api/health`
- **Tam uç listesi ve hata anahtarları:** `docs/DESIGN.md` (Ek B, Ek A)
- **Swagger:** geliştirmede varsayılan açık — `http://localhost:3002/api/docs`. Üretimde yalnızca `SWAGGER_ENABLED=true` ile.

## Üretim dağıtımı (örnek: Render)

- Build: `npm ci && npm run build` (production’da `devDependencies` atlanabilir; `@types/bcrypt` `dependencies` içinde tutulur — TS derlemesi için gerekli)
- Start: `npm run start:prod` veya `node dist/main`
- Ortamda mutlaka tanımlayın: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS` (frontend kökü), güçlü `ADMIN_*`

Gizli değerler repoda tutulmaz; yalnızca barındırıcı ortam değişkenleri / secrets kullanılır.
