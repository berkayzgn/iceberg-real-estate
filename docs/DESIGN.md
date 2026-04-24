# DESIGN.md — Iceberg Digital: Real-estate transaction operations *(English)*

> Architectural decisions for an end-to-end system on the NestJS + MongoDB Atlas + Nuxt 3 stack that manages a real-estate agency’s post-agreement workflow (earnest money → title deed → completion) and commission distribution.

- **Repository layout:** `backend/` (NestJS API), `frontend/` (Nuxt 3 admin UI), `docs/` (this document).
- **Setup / run:** Root `README.md`, `backend/README.md`, `frontend/README.md`.
- **Production:** Render (API) + Vercel (client) + MongoDB Atlas — URLs in the root `README.md`.

---

## Table of contents

1. [Case requirements → document mapping](#1-case-requirements--document-mapping)
2. [Architecture overview](#2-architecture-overview)
3. [Data model](#3-data-model)
4. [Transaction lifecycle and stage transitions](#4-transaction-lifecycle-and-stage-transitions)
5. [Financial breakdown: approach and rationale](#5-financial-breakdown-approach-and-rationale)
6. [Commission policy and scenarios](#6-commission-policy-and-scenarios)
7. [API surface, validation, and error handling](#7-api-surface-validation-and-error-handling)
8. [Authentication and security](#8-authentication-and-security)
9. [Frontend architecture (Nuxt 3 + Pinia)](#9-frontend-architecture-nuxt-3--pinia)
10. [Testing strategy](#10-testing-strategy)
11. [Deployment and operations](#11-deployment-and-operations)
12. [Design freedom matrix](#12-design-freedom-matrix)
13. [Appendix A — Error keys](#appendix-a--error-keys)
14. [Appendix B — Endpoint summary](#appendix-b--endpoint-summary)

---

## 1. Case requirements → document mapping

The table below maps each section of the technical case brief to where it is covered in this document.

| Case section | Mapping | Section |
|--------------|---------|---------|
| §1 Main Problem / §2 Expected Solution | Problem framing and high-level solution | §2 |
| §3 Tech Stack Requirements | Mandatory stack (NestJS, MongoDB Atlas, Mongoose, Nuxt 3, Pinia, Tailwind, Jest) | §2, §10 |
| §4.1 Transaction Stages | Stages, transition rules, **blocking invalid transitions** | §4 |
| §4.2 Financial Breakdown | Report content + **embedded storage** rationale | §5 |
| §4.3 Company Commission Policy | 50 / 50 rule + two scenarios + worked examples + tests | §6 |
| §5 Design Freedom & Responsibilities | Rationale for each free-design area | §12 |
| §6.1 Source Code | Public Git repo (`backend/` + `frontend/`) | `README.md` |
| §6.2 Unit Tests | Jest unit tests | §10 |
| §6.3 DESIGN.md | This document | — |
| §6.4 README.md | Setup / run | `README.md` |
| §6.5 Deployment & Live URLs | Render + Vercel + MongoDB Atlas | `README.md`, §11 |

---

## 2. Architecture overview

### 2.1 Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| API | NestJS, TypeScript | Modular layout, global `ValidationPipe`, global exception filter |
| Database | MongoDB Atlas + Mongoose | Single database; collections: `agents`, `transactions`, `users` |
| Auth | JWT (Bearer) + bcrypt | Single panel user seeded on first boot |
| Client | Nuxt 3 (SPA mode), Pinia | Tailwind CSS, `@nuxtjs/i18n` (TR / EN) |
| Tests | Jest | Unit tests for commission and transition rules |

### 2.2 Data flow

```
Nuxt 3 UI  ──►  Pinia store  ──►  authorizedFetch (Bearer JWT)  ──►  NestJS /api
                                                                         │
                                                                         ▼
                                                          Controller → Service → Mongoose
                                                                         │
                                                                         ▼
                                                                  MongoDB Atlas
```

- **Controllers** are a thin HTTP boundary with DTO validation.
- **Services** are the single source of business rules (state machine, commission math, delete constraints).
- **Mongoose schemas** define persistence only; they do not encode business rules.

### 2.3 Directory layout (summary)

```
backend/src/
├─ common/
│  ├─ enums/transaction-stage.enum.ts      # Stage machine and VALID_TRANSITIONS
│  ├─ filters/http-exception.filter.ts     # Standard error body
│  ├─ pipes/parse-mongo-id.pipe.ts         # ObjectId validation
│  └─ decorators/public.decorator.ts
├─ modules/
│  ├─ auth/       # JWT strategy, guard, login endpoint
│  ├─ users/      # Panel user (internal only)
│  ├─ agents/     # Agent CRUD + delete constraint
│  ├─ transactions/  # Transaction CRUD, stage, breakdown
│  └─ reports/    # Summary + per-agent report
└─ main.ts / app.module.ts
frontend/
├─ pages/        # login, dashboard, transactions, agents, reports
├─ stores/       # auth, agents, transactions, ui, toast
├─ components/   # transaction/*, agents/*, dashboard/*
├─ composables/  # useDateTimeFormat, useCountUp, etc.
├─ utils/        # api-error, auth-token, domain, phone-dial-codes, …
└─ i18n/locales/ # tr.json, en.json
```

---

## 3. Data model

### 3.1 `Agent` — `backend/src/modules/agents/schemas/agent.schema.ts`

| Field | Type | Notes |
|-------|------|-------|
| `firstName`, `lastName` | `string` (required, `trim`) | `fullName` virtual used in lists |
| `email` | `string` (required, **unique**, lowercase) | Duplicates return `errors.emailInUse` |
| `phone` | `string` (required) | Country dial code + local number on the client |
| `title`, `specialization` | `string` | Free text (e.g. job title, focus area) |
| `isActive` | `boolean`, default `true` | Can support soft-disable instead of hard delete |
| `createdAt`, `updatedAt` | Mongoose timestamps | — |

**Delete rule:** `DELETE /api/agents/:id` succeeds only when the agent is not referenced as `listingAgent` or `sellingAgent` on any transaction. Otherwise **HTTP 400 + `errors.agentInUse`**, and the client shows delete only when that condition holds. This prevents orphaning agent references on historical commission data.

### 3.2 `Transaction` — `backend/src/modules/transactions/schemas/transaction.schema.ts`

| Field | Type | Notes |
|-------|------|-------|
| `propertyAddress` | `string` (5–200 chars) | Free text |
| `propertyType` | `'sale' \| 'rental'` | Distinct in reports |
| `transactionValue` | `number` ≥ 0 | Service fee (single currency: USD) |
| `stage` | `TransactionStage` enum | Default `agreement` |
| `listingAgent`, `sellingAgent` | `ObjectId → Agent` | May be the same person (single-agent deal) |
| `stageHistory[]` | `{ fromStage, toStage, changedAt, note? }` | Audit / activity trail |
| `commissionBreakdown?` | Embedded subdocument | Filled only when `stage === completed` (§5) |
| `completedAt?` | `Date` | Set on transition to `completed` |
| `createdAt`, `updatedAt` | Mongoose timestamps | — |

### 3.3 `User` (panel operator)

Login only: `email` (unique), `passwordHash` (bcrypt, cost 10). Seed: created on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if missing (see §8).

---

## 4. Transaction lifecycle and stage transitions

**Requirement (§4.1):** Track stages, allow transitions, visualize and trigger them from the dashboard, **optionally block invalid transitions (document the decision in DESIGN.md).**

### 4.1 Stages

| Case label | Enum value | Meaning |
|------------|------------|---------|
| Agreement | `agreement` | Agreement signed (default when a transaction is created) |
| Earnest money | `earnest_money` | Earnest money received |
| Title deed | `title_deed` | Title / deed work started or completed |
| Completed | `completed` | Deal closed; commission breakdown is produced |

### 4.2 State machine

Deterministic table in `backend/src/common/enums/transaction-stage.enum.ts`:

```
agreement      ──► earnest_money
earnest_money  ──► title_deed
title_deed     ──► completed
completed      ──► (terminal)
```

### 4.3 Decision: invalid transitions **are blocked**

- **Why mandatory?** Commission is computed at `completed`. Skipping stages or moving backward can make financial reports inconsistent. One-step-forward keeps the workflow auditable via `stageHistory`.
- **Server:** `TransactionsService.updateStage` throws `BadRequestException('errors.invalidStageTransition')` (HTTP 400) when the target is not in `VALID_TRANSITIONS[current]`.
- **Client:** The dashboard funnel allows drag-and-drop only to the next column; the detail “advance” action targets only the next stage. API errors still surface in toasts (defense in depth).
- **Traceability:** Each change appends to `stageHistory[]` with `fromStage → toStage`, `changedAt`, and optional `note`; activity text uses i18n keys.

### 4.4 Dashboard visualization

- **Funnel:** Columns per stage; card counts, total deal value, percentage share.
- **Completion:** In `completed`, cards show a commission summary; detail shows the full breakdown.
- **Activity feed:** Built chronologically from `stageHistory[]` and completion events.

---

## 5. Financial breakdown: approach and rationale

**Requirement (§4.2):** For every completed transaction, clearly report how much the agency earned, how much each agent earned, and **why** (listing vs selling). Storage is flexible—**justify the choice.**

### 5.1 Report content

For completed transactions, the following fields are consistent across `GET /api/transactions/:id` (embedded), `GET /api/transactions/:id/breakdown`, and `GET /api/reports/*`.

| Field | Meaning |
|-------|---------|
| `agencyShare` | Agency share (50% of the service fee) |
| `agentTotal` | Total pool for agents (50% of the service fee) |
| `listingAgentShare` | Listing agent’s share |
| `sellingAgentShare` | Selling agent’s share |
| `sameAgent` | `true` if `listingAgent === sellingAgent` |
| `reason` | `same_agent` \| `different_agents` (or `fallback` for legacy report compatibility) |

The **“why?”** is carried in `reason`. The client maps it through `commission.reason.*` i18n keys so the backend stays language-agnostic.

### 5.2 Storage decision — embedded

Three options were evaluated:

| Option | Decision | Rationale |
|--------|----------|-----------|
| **Embedded in the transaction document** | **Chosen.** | (1) Single read for deal + breakdown; no join. (2) **Point-in-time snapshot** at completion: policy changes later do not rewrite history (audit). (3) Natural ownership: the breakdown belongs to the transaction. |
| Separate collection | Not used | Cross-document consistency (transactional writes) adds cost without enough benefit here. |
| Dynamic only | Not primary | Rules are deterministic, but history (which agents, which policy) can be lost. **Resilient reporting** still recomputes when `commissionBreakdown` is missing (`ReportsService`, `reason: fallback`) for old seeds / edge cases. |

**Outcome:** Embedded field is authoritative; dynamic recompute is a backward-compatibility safety net.

---

## 6. Commission policy and scenarios

**Requirement (§4.3):** 50% agency, 50% agents; same person in both roles gets the full agent pool; two different agents split it 25% / 25% each of the total fee.

Implementation: `TransactionsService.calculateCommissionBreakdown` (single source of truth). It runs once on `stage → completed` and persists `commissionBreakdown`.

### 6.1 Example — Scenario 1 (same agent)

`transactionValue = 100,000` and `listingAgent === sellingAgent`:

```
agencyShare        = 50,000
agentTotal         = 50,000
listingAgentShare  = 50,000   ← full agent pool
sellingAgentShare  =      0
sameAgent          = true
reason             = "same_agent"
```

### 6.2 Example — Scenario 2 (two agents)

`transactionValue = 100,000` and listing ≠ selling:

```
agencyShare        = 50,000
agentTotal         = 50,000
listingAgentShare  = 25,000
sellingAgentShare  = 25,000
sameAgent          = false
reason             = "different_agents"
```

### 6.3 Tests

`backend/src/modules/transactions/transactions.service.spec.ts`:

- All valid and invalid `stage` transition pairs (positive + negative).
- Correct `commissionBreakdown` for both scenarios on `completed`.
- `completedAt` set after completion and no further forward transitions.

`backend/src/modules/agents/agents.service.spec.ts`: duplicate email and delete constraint.  
`backend/src/modules/reports/reports.service.spec.ts`: report totals and `fallback` path.

---

## 7. API surface, validation, and error handling

All routes are under the `/api` prefix. Swagger UI is at `/api/docs` in development; in production it is off unless `SWAGGER_ENABLED=true`.

### 7.1 Validation

- **DTOs + `class-validator`:** `CreateTransactionDto`, `UpdateStageDto`, `CreateAgentDto`, `UpdateAgentDto`, `LoginDto`.
- **Global `ValidationPipe`:** `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true` (`main.ts`). Unknown fields are **not** silently stripped—request fails with 400.
- **`ParseMongoIdPipe`:** Invalid ObjectId in route params → `errors.invalidObjectId` (HTTP 400).

### 7.2 Error body

`GlobalHttpExceptionFilter` (`common/filters/http-exception.filter.ts`) returns a consistent JSON shape:

```json
{
  "statusCode": 400,
  "timestamp": "2026-04-24T12:00:00.000Z",
  "path": "/api/transactions/abc/stage",
  "method": "PATCH",
  "message": "errors.invalidStageTransition",
  "errors": ["propertyAddress must be shorter than or equal to 200 characters"]
}
```

- For domain / not-found errors, **`message`** is an **i18n key** (`errors.*`). The client chooses the locale; the API stays language-agnostic.
- DTO validation failures populate `errors[]` with `class-validator` strings.
- Unknown failures → HTTP 500, `message: "Internal server error"`.

### 7.3 Client-side translation

`frontend/utils/api-error.ts` — `toApiErrorInfo(error, t, fallbackKey)`:

1. Reads `message` and/or `errors[]` from the body.
2. Translates strings starting with `errors.*` via `vue-i18n`.
3. Picks a title from status (`errors.badRequestTitle` / `errors.notFoundTitle` / `errors.serverTitle`).
4. Falls back to the caller’s i18n key when needed.

Adding a new backend error is usually a one-line i18n update on the client.

---

## 8. Authentication and security

- **JWT:** All routes are protected by default (`APP_GUARD: JwtAuthGuard`). `@Public()` applies only to `POST /api/auth/login`, `GET /api`, `GET /api/health`.
- **Seed user:** `UsersService.onApplicationBootstrap` creates the panel user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if missing (bcrypt, cost 10). Change these in production; never commit real secrets.
- **Token storage (client):** `sessionStorage`. Rationale: session-scoped panel; each new tab signs in again, narrowing persistence if the browser is compromised. `localStorage` would survive XSS longer; `httpOnly` cookies would need CSRF / SameSite work beyond this scope.
- **CORS:** `CORS_ORIGINS`; `*` warns and is disabled in production. Allowed headers: `Authorization`, `Content-Type`; `credentials: false`.
- **Passwords:** bcrypt (cost 10). Login responses use `Cache-Control: no-store`.
- **Secrets:** `JWT_SECRET`, `MONGODB_URI`, Atlas strings live in platform env only; the repo ships `.env.example` templates.

---

## 9. Frontend architecture (Nuxt 3 + Pinia)

### 9.1 Route map

| Route | Purpose |
|-------|---------|
| `/login` | Sign in with JWT (split layout, `public/img/iceberg.jpg`) |
| `/` | Dashboard: metrics, stage funnel, recent activity |
| `/transactions` | Transaction list + filters |
| `/transactions/create` | New transaction modal / form |
| `/transactions/:id` | Detail, advance stage, commission breakdown when completed |
| `/agents` | Agent list |
| `/agents/:id` | Agent detail + performance |
| `/reports` | Agency summary and per-agent earnings |

i18n: `no_prefix` (stable URLs; locale in a cookie).

### 9.2 Pinia stores

| Store | Responsibility |
|-------|----------------|
| `auth` | Login, logout, `sessionStorage` hydration, Bearer helper |
| `agents` | List, detail cache, create / update / delete |
| `transactions` | List, detail, stage updates, create, delete, activity mapping (`mapActivityLog`) |
| `ui` | Sidebar, modals |
| `toast` | Success / error toasts (i18n titles) |

Read-only report calls (e.g. `GET /transactions/:id/breakdown`, `GET /reports/*`) may use `authorizedFetch` directly on pages so stores stay mutation-focused.

### 9.3 Internationalization

- `@nuxtjs/i18n` + `vue-i18n`; full TR (default) and EN.
- **All** user-visible strings (errors, stage labels, activity, commission reasons, time formats) go through i18n keys.
- Helpers: `composables/useDateTimeFormat`, `utils/format-activity.ts`, `utils/commission-reason.ts` (normalize legacy `reason` text).

### 9.4 Theme and UI

- Tailwind CSS; brand **navy `#0A1628` + gold `#D4A853`**.
- Typography: Inter (body) + Plus Jakarta Sans (headings).
- Material Symbols Outlined (static CDN).

---

## 10. Testing strategy

- **Runner:** Jest (NestJS default).
- **Unit tests (`npm test`):**
  - `TransactionsService` — full transition matrix, commission on `completed`, `stageHistory`, `getBreakdown` preconditions.
  - `AgentsService` — duplicate email, `errors.agentInUse` on referenced delete.
  - `ReportsService` — aggregates over completed deals, `fallback` path.
- **Client smoke:** `npm run build` (Nuxt) catches type errors in CI.
- **Coverage goal:** Critical rules (§4, §5, §6) fully covered; controllers can add tests via Nest DI as needed.

---

## 11. Deployment and operations

| Component | Platform | Notes |
|-----------|----------|-------|
| API | Render (Web Service) | `npm ci && npm run build` → `node dist/main.js`. `NODE_ENV=production`; Swagger off by default. |
| Database | MongoDB Atlas | IP allow list, dedicated DB user, `MONGODB_URI` only. |
| Client | Vercel (Nuxt 3) | `NUXT_PUBLIC_API_BASE`; static output vs SSR per README. |
| Health | `GET /api/health` | Liveness. |
| CORS | `CORS_ORIGINS` | Production: explicit Vercel origin; `*` logs a warning. |
| Secrets | Platform secrets | Repo contains only `.env.example`. |

---

## 12. Design freedom matrix

Mapping case §5 to concrete choices:

| Area | Decision | In this doc |
|------|----------|-------------|
| **Module & service structure** | Feature modules (`auth`, `users`, `agents`, `transactions`, `reports`); controllers are thin; rules live in services. | §2.3 |
| **Schema vs business logic** | Mongoose for persistence; services enforce rules (state machine, commission, delete guard, duplicate email). Commission **embedded**. | §3, §5 |
| **API & page structure** | REST resources under `/api/agents`, `/api/transactions`, `/api/reports`; UI mirrors with `/agents`, `/transactions`, `/reports`. | §7, §9.1, Appendix B |
| **Errors & validation** | Global `ValidationPipe` + `class-validator` + `ParseMongoIdPipe`; filter shapes errors; domain messages use `errors.*`, translated on the client. | §7 |
| **Frontend UI/UX** | Branded dashboard, stage funnel (drag-and-drop), detail advance flow, financial reports, modal CRUD, full i18n. | §9 |

---

## Appendix A — Error keys

All `errors.*` keys returned by the API (mirrored in `frontend/i18n/locales/{tr,en}.json`):

| Key | HTTP | Where |
|-----|------|-------|
| `errors.invalidCredentials` | 401 | `AuthService.login` |
| `errors.authMissingToken`, `errors.authInvalidToken` | 401 | `JwtAuthGuard` |
| `errors.invalidObjectId` | 400 | `ParseMongoIdPipe` |
| `errors.emailInUse` | 400 | `AgentsService.create/update` (duplicate) |
| `errors.agentInUse` | 400 | `AgentsService.remove` (referenced) |
| `errors.agentNotFound` | 404 | `AgentsService`, `ReportsService.getAgentReport` |
| `errors.transactionNotFound` | 404 | `TransactionsService` |
| `errors.invalidStageTransition` | 400 | `TransactionsService.updateStage` |
| `errors.breakdownNotReady` | 400 | `TransactionsService.getBreakdown` (not completed yet) |
| `errors.listingAgentNotFound`, `errors.sellingAgentNotFound` | 400 | `TransactionsService.create` |

## Appendix B — Endpoint summary

All paths use the `/api` prefix. Non-public routes require `Authorization: Bearer <jwt>`.

| Method & path | Description | Access |
|---------------|-------------|--------|
| `GET /` | Root meta | Public |
| `GET /health` | Health check | Public |
| `POST /auth/login` | Issues JWT | Public |
| `GET /agents` | List | JWT |
| `POST /agents` | Create | JWT |
| `GET /agents/:id` | Detail | JWT |
| `PATCH /agents/:id` | Update | JWT |
| `DELETE /agents/:id` | Delete (if unreferenced) | JWT |
| `GET /transactions` | List | JWT |
| `POST /transactions` | Create (default `stage: agreement`) | JWT |
| `GET /transactions/:id` | Detail (populated) | JWT |
| `PATCH /transactions/:id/stage` | Advance stage **one step forward** | JWT |
| `GET /transactions/:id/breakdown` | Embedded commission breakdown | JWT |
| `DELETE /transactions/:id` | Delete | JWT |
| `GET /reports/summary` | Agency-level totals | JWT |
| `GET /reports/agent/:id` | Per-agent earnings and role split | JWT |

— *Delivery revision.*

---

# DESIGN.md — Iceberg Digital Emlak İşlem Yönetimi

> NestJS + MongoDB Atlas + Nuxt 3 yığını üzerinde, bir emlak danışmanlık ofisinin anlaşma sonrası süreçlerini (kaparo → tapu → tamamlanma) ve komisyon dağıtımını uçtan uca yöneten sistemin mimari kararları.

- **Repo yapısı:** `backend/` (NestJS API), `frontend/` (Nuxt 3 paneli), `docs/` (bu doküman).
- **Kurulum / çalıştırma:** Kök `README.md`, `backend/README.md`, `frontend/README.md`.
- **Canlı ortam:** Render (API) + Vercel (istemci) + MongoDB Atlas — URL’ler kök `README.md`’de.

---

## İçindekiler

1. [Gereksinim → belge bölümü eşleşmesi](#1-gereksinim--belge-bölümü-eşleşmesi)
2. [Mimari genel bakış](#2-mimari-genel-bakış)
3. [Veri modeli](#3-veri-modeli)
4. [İşlem yaşam döngüsü ve aşama geçişleri](#4-işlem-yaşam-döngüsü-ve-aşama-geçişleri)
5. [Finansal döküm: yaklaşım ve gerekçe](#5-finansal-döküm-yaklaşım-ve-gerekçe)
6. [Komisyon politikası ve senaryolar](#6-komisyon-politikası-ve-senaryolar)
7. [API yüzeyi, doğrulama ve hata yönetimi](#7-api-yüzeyi-doğrulama-ve-hata-yönetimi)
8. [Kimlik doğrulama ve güvenlik](#8-kimlik-doğrulama-ve-güvenlik)
9. [Frontend mimarisi (Nuxt 3 + Pinia)](#9-frontend-mimarisi-nuxt-3--pinia)
10. [Test stratejisi](#10-test-stratejisi)
11. [Dağıtım ve operasyon](#11-dağıtım-ve-operasyon)
12. [Tasarım özgürlüğü matrisi](#12-tasarım-özgürlüğü-matrisi)
13. [Ek A — Hata anahtarları](#ek-a--hata-anahtarları)
14. [Ek B — Uç nokta özeti](#ek-b--uç-nokta-özeti)

---

## 1. Gereksinim → belge bölümü eşleşmesi

Aşağıdaki tablo, teknik case dokümanındaki her başlığın bu belgede nerede karşılandığını gösterir.

| Case başlığı | Karşılık | Bölüm |
|--------------|----------|-------|
| §1 Main Problem / §2 Expected Solution | Problem çerçevesi ve yüksek seviye çözüm | §2 |
| §3 Tech Stack Requirements | Zorunlu yığın (NestJS, MongoDB Atlas, Mongoose, Nuxt 3, Pinia, Tailwind, Jest) | §2, §10 |
| §4.1 Transaction Stages | Aşamalar, geçiş kuralları, **geçersiz geçişlerin engellenmesi** kararı | §4 |
| §4.2 Financial Breakdown | Rapor içeriği + **gömülü saklama** kararının gerekçesi | §5 |
| §4.3 Company Commission Policy | 50 / 50 kuralı + iki senaryo + örnek hesap + testler | §6 |
| §5 Design Freedom & Responsibilities | Her özgür alanın gerekçesi | §12 |
| §6.1 Source Code | Public Git repo (`backend/` + `frontend/`) | `README.md` |
| §6.2 Unit Tests | Jest birim testleri | §10 |
| §6.3 DESIGN.md | Bu belge | — |
| §6.4 README.md | Kurulum / çalıştırma | `README.md` |
| §6.5 Deployment & Live URLs | Render + Vercel + MongoDB Atlas | `README.md`, §11 |

---

## 2. Mimari genel bakış

### 2.1 Yığın

| Katman | Teknoloji | Notlar |
|--------|-----------|--------|
| API | NestJS, TypeScript | Modüler yapı, global `ValidationPipe`, global exception filter |
| Veritabanı | MongoDB Atlas + Mongoose | Tek veritabanı; koleksiyonlar: `agents`, `transactions`, `users` |
| Kimlik | JWT (Bearer) + bcrypt | Tek panel kullanıcısı ilk çalıştırmada seed edilir |
| İstemci | Nuxt 3 (SPA modunda), Pinia | Tailwind CSS, `@nuxtjs/i18n` (TR / EN) |
| Test | Jest | Komisyon ve geçiş kuralları için birim testler |

### 2.2 Veri akışı

```
Nuxt 3 UI  ──►  Pinia store  ──►  authorizedFetch (Bearer JWT)  ──►  NestJS /api
                                                                         │
                                                                         ▼
                                                          Controller → Service → Mongoose
                                                                         │
                                                                         ▼
                                                                  MongoDB Atlas
```

- **Controller**, HTTP sınırı ve DTO doğrulaması için ince bir katmandır.
- **Service**, iş kurallarının tek kaynağıdır (aşama makinesi, komisyon hesabı, silme kısıtları).
- **Mongoose şemaları** yalnızca kalıcılık tanımlarını içerir; kural barındırmaz.

### 2.3 Dizin organizasyonu (özet)

```
backend/src/
├─ common/
│  ├─ enums/transaction-stage.enum.ts      # Aşama makinesi ve VALID_TRANSITIONS
│  ├─ filters/http-exception.filter.ts     # Standart hata gövdesi
│  ├─ pipes/parse-mongo-id.pipe.ts         # ObjectId doğrulama
│  └─ decorators/public.decorator.ts
├─ modules/
│  ├─ auth/       # JWT stratejisi, guard, login endpoint
│  ├─ users/      # Panel kullanıcısı (yalnızca dahili)
│  ├─ agents/     # Danışman CRUD + silme kısıtı
│  ├─ transactions/  # İşlem CRUD, stage, breakdown
│  └─ reports/    # Özet + danışman bazlı rapor
└─ main.ts / app.module.ts
frontend/
├─ pages/        # login, dashboard, transactions, agents, reports
├─ stores/       # auth, agents, transactions, ui, toast
├─ components/   # transaction/*, agents/*, dashboard/*
├─ composables/  # useDateTimeFormat, useCountUp, vb.
├─ utils/        # api-error, auth-token, domain, phone-dial-codes, …
└─ i18n/locales/ # tr.json, en.json
```

---

## 3. Veri modeli

### 3.1 `Agent` — `backend/src/modules/agents/schemas/agent.schema.ts`

| Alan | Tip | Notlar |
|------|-----|--------|
| `firstName`, `lastName` | `string` (zorunlu, `trim`) | `fullName` virtual alanı listelerde kullanılır |
| `email` | `string` (zorunlu, **unique**, lowercase) | Çakışmada backend `errors.emailInUse` döner |
| `phone` | `string` (zorunlu) | İstemcide ülke kodu seçici + yerel numara |
| `title`, `specialization` | `string` | Serbest metin (ör. "Kıdemli Danışman", "Rezidans") |
| `isActive` | `boolean`, default `true` | Pasifleştirme — hard delete yerine soft gösterim için kullanılabilir |
| `createdAt`, `updatedAt` | Mongoose timestamps | — |

**Silme kuralı:** `DELETE /api/agents/:id` yalnızca hiçbir işlemde `listingAgent` veya `sellingAgent` olarak geçmeyen bir kayıt için başarıyla döner. Referanslı silmede **HTTP 400 + `errors.agentInUse`** yanıtı üretilir ve istemcide silme aksiyonu yalnızca bu koşulu sağlayan kartlarda gösterilir. Bu, geçmiş komisyon dökümünde danışman referansının boşa düşmesini engeller.

### 3.2 `Transaction` — `backend/src/modules/transactions/schemas/transaction.schema.ts`

| Alan | Tip | Notlar |
|------|-----|--------|
| `propertyAddress` | `string` (5–200 krk) | Serbest metin |
| `propertyType` | `'sale' \| 'rental'` | Raporlarda ayırt edici |
| `transactionValue` | `number` ≥ 0 | Hizmet bedeli (tek para birimi: USD) |
| `stage` | `TransactionStage` enum | Varsayılan `agreement` |
| `listingAgent`, `sellingAgent` | `ObjectId → Agent` | İkisi aynı kişi olabilir (tek ajanlı işlem) |
| `stageHistory[]` | `{ fromStage, toStage, changedAt, note? }` | Denetim / aktivite akışı için |
| `commissionBreakdown?` | Gömülü alt şema | Yalnızca `stage === completed` iken doldurulur (§5) |
| `completedAt?` | `Date` | `completed` geçişinde set edilir |
| `createdAt`, `updatedAt` | Mongoose timestamps | — |

### 3.3 `User` (panel operatörü)

Yalnızca login için; `email` (unique), `passwordHash` (bcrypt, cost 10). Seed: ilk çalıştırmada `ADMIN_EMAIL` / `ADMIN_PASSWORD` yoksa oluşturulur (bkz. §8).

---

## 4. İşlem yaşam döngüsü ve aşama geçişleri

**Gereksinim (§4.1):** Aşamaları takip et, geçişe izin ver, panelde görselleştir, **isteğe bağlı olarak geçersiz geçişleri engelle (karar DESIGN.md’de)**.

### 4.1 Aşamalar

| Case başlığı | Enum değeri | Anlam |
|--------------|-------------|-------|
| Agreement | `agreement` | Anlaşma imzalandı (işlem oluşturulduğunda varsayılan) |
| Earnest money | `earnest_money` | Kaparo alındı |
| Title deed | `title_deed` | Tapu işlemleri başladı / tamamlandı |
| Completed | `completed` | İşlem kapandı; komisyon dökümü üretilir |

### 4.2 Geçiş makinesi

`backend/src/common/enums/transaction-stage.enum.ts` dosyasındaki deterministik tablo:

```
agreement      ──► earnest_money
earnest_money  ──► title_deed
title_deed     ──► completed
completed      ──► (sonlu)
```

### 4.3 Karar: geçersiz geçişler **engellenir**

- **Neden zorunlu kılındı?** Sahada komisyon dökümü `completed` aşamasında hesaplanır; atlamalı veya geriye dönük geçişlere izin vermek finansal raporu tutarsız hale getirebilir. Tek adım ileri kuralı iş akışını `stageHistory` üzerinden denetlenebilir tutar.
- **Sunucu tarafı:** `TransactionsService.updateStage` izinli hedefler `VALID_TRANSITIONS[current]` içinde değilse `BadRequestException('errors.invalidStageTransition')` fırlatır (HTTP 400).
- **İstemci tarafı:** Dashboard aşama hunisinde sürükle-bırak yalnızca bir sonraki kolona bırakmaya izin verir; detay ekranında “ileri al” butonu yalnızca bir sonraki aşamayı hedefler. API hatası yine de toasta yansıtılır (defans derinliği).
- **İzlenebilirlik:** Her geçiş `stageHistory[]` içine `fromStage → toStage`, `changedAt` ve isteğe bağlı `note` ile yazılır; aktivite akışında i18n anahtarlarıyla gösterilir.

### 4.4 Dashboard görselleştirmesi

- **Huni (funnel):** Aşamaya göre kolonlar; kart sayısı, toplam işlem değeri ve yüzdelik paylar.
- **Tamamlanma:** `completed` kolonunda kartta komisyon özeti; detayda tam döküm.
- **Aktivite akışı:** `stageHistory[]` + tamamlanma olayı birleştirilerek kronolojik liste üretilir.

---

## 5. Finansal döküm: yaklaşım ve gerekçe

**Gereksinim (§4.2):** Tamamlanmış her işlem için ajans ne kadar kazandı, her danışman ne kadar kazandı, **neden** o kadar kazandı açıkça raporlanmalı. Saklama biçimi serbest; **gerekçelendir**.

### 5.1 Rapor içeriği

Her tamamlanmış işlem için aşağıdaki alanlar hem `GET /api/transactions/:id` (gömülü), hem `GET /api/transactions/:id/breakdown`, hem de `GET /api/reports/*` uçlarında tutarlı şekilde döner.

| Alan | Anlamı |
|------|--------|
| `agencyShare` | Ajansın payı (hizmet bedelinin %50’si) |
| `agentTotal` | Tüm ajanlara dağıtılacak toplam (hizmet bedelinin %50’si) |
| `listingAgentShare` | Listeleyici danışmanın payı |
| `sellingAgentShare` | Satıcı danışmanın payı |
| `sameAgent` | `listingAgent === sellingAgent` ise `true` |
| `reason` | `same_agent` \| `different_agents` (rapor geri uyumu için `fallback`) |

**“Neden?”** sorusunun cevabı `reason` alanı ile taşınır. İstemci, bu anahtarı `commission.reason.*` i18n anahtarlarıyla TR / EN’e çevirir; böylece backend dilden bağımsız kalır.

### 5.2 Saklama kararı — gömülü (embedded)

Üç seçenek değerlendirildi:

| Seçenek | Karar | Gerekçe |
|---------|-------|---------|
| **İşlem belgesine gömülü** | **Seçildi.** | (1) Tek sorguda işlem + döküm; join yok. (2) Tamamlanma anındaki **anlık görüntü** saklandığı için sonradan politika değişse de geçmiş kayıt değişmez (denetim güvencesi). (3) Doğal sahiplik: döküm işleme aittir, bağımsız yaşam döngüsü yoktur. |
| Ayrı koleksiyon | Kullanılmadı | İki kaynak arasında tutarlılık yönetimi (transactional write) gerektirir; bu kapsam için maliyet faydayı aşar. |
| Yalnızca dinamik hesaplama | Birincil değil | Kural deterministik olsa da geçmiş bilgisi (o an hangi danışman, hangi politika) dönüşümlerde kaybolabilir. Ancak **dirençli rapor** için kullanılır: `commissionBreakdown` eksikse `ReportsService` aynı formülü uygular ve `reason: fallback` ile döndürür (eski seed verisi / edge durum). |

**Sonuç:** Birincil kaynak gömülü alan; dinamik hesaplama yalnızca geri uyumluluk güvencesidir.

---

## 6. Komisyon politikası ve senaryolar

**Gereksinim (§4.3):** Hizmet bedelinin **%50 ajans**, **%50 ajan(lar)** arasında; aynı kişi her iki rolde ise ajan payının tamamı ona, farklı kişilerse %25 / %25.

Uygulama: `TransactionsService.calculateCommissionBreakdown` (tek kaynak). Hesaplama `stage → completed` geçişinde bir kez yapılır ve `commissionBreakdown` alanına yazılır.

### 6.1 Örnek — Senaryo 1 (aynı danışman)

`transactionValue = 100.000` ve `listingAgent === sellingAgent`:

```
agencyShare        = 50.000
agentTotal         = 50.000
listingAgentShare  = 50.000   ← tam ajan payı
sellingAgentShare  =      0
sameAgent          = true
reason             = "same_agent"
```

### 6.2 Örnek — Senaryo 2 (iki farklı danışman)

`transactionValue = 100.000` ve listing ≠ selling:

```
agencyShare        = 50.000
agentTotal         = 50.000
listingAgentShare  = 25.000
sellingAgentShare  = 25.000
sameAgent          = false
reason             = "different_agents"
```

### 6.3 Testler

`backend/src/modules/transactions/transactions.service.spec.ts`:

- Tüm geçerli ve geçersiz `stage` geçiş çiftleri (pozitif + negatif).
- `completed` geçişinde `commissionBreakdown`’un her iki senaryo için doğru hesaplandığı.
- `completed` sonrası `completedAt` set edildiği ve ileri geçişin engellendiği.

`backend/src/modules/agents/agents.service.spec.ts`: e-posta çakışması ve silme kısıtı.
`backend/src/modules/reports/reports.service.spec.ts`: rapor toplamları ve `fallback` akışı.

---

## 7. API yüzeyi, doğrulama ve hata yönetimi

Tüm uçlar `/api` öneki altında. Swagger UI geliştirmede `/api/docs`; üretimde varsayılan olarak kapalıdır (`SWAGGER_ENABLED=true` ile açılabilir).

### 7.1 Doğrulama

- **DTO’lar + `class-validator`:** `CreateTransactionDto`, `UpdateStageDto`, `CreateAgentDto`, `UpdateAgentDto`, `LoginDto`.
- **Global `ValidationPipe`:** `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true` (main.ts). Beklenmeyen alanlar sessizce kırpılmaz — 400 döner.
- **`ParseMongoIdPipe`:** Route parametrelerinde geçersiz ObjectId için `errors.invalidObjectId` (HTTP 400).

### 7.2 Hata gövdesi

Global `GlobalHttpExceptionFilter` (`common/filters/http-exception.filter.ts`) tutarlı bir JSON üretir:

```json
{
  "statusCode": 400,
  "timestamp": "2026-04-24T12:00:00.000Z",
  "path": "/api/transactions/abc/stage",
  "method": "PATCH",
  "message": "errors.invalidStageTransition",
  "errors": ["propertyAddress must be shorter than or equal to 200 characters"]
}
```

- İş kuralı / bulunamadı hatalarında **`message`** değeri bir **i18n anahtarı**dır (`errors.*`). Dil seçimi istemci sorumluluğundadır; backend dilden bağımsızdır.
- Doğrulama (DTO) hataları `errors[]` dizisine `class-validator` mesajları olarak yerleşir.
- Bilinmeyen hata → HTTP 500, `message: "Internal server error"`.

### 7.3 İstemci tarafı hata çevirisi

`frontend/utils/api-error.ts` içindeki `toApiErrorInfo(error, t, fallbackKey)`:

1. Gövdeden `message` ve/veya `errors[]` okur.
2. `errors.*` ile başlayan dizeleri `vue-i18n` üzerinden çevirir.
3. Statü koduna göre başlık üretir (`errors.badRequestTitle` / `errors.notFoundTitle` / `errors.serverTitle`).
4. Fallback olarak çağıranın verdiği i18n anahtarı kullanılır.

Bu mimari sayesinde backend’e yeni bir hata eklemek tek satırlık bir i18n güncellemesiyle kullanıcı diline yansır.

---

## 8. Kimlik doğrulama ve güvenlik

- **JWT stratejisi:** Tüm route’lar varsayılan olarak korumalıdır (`APP_GUARD: JwtAuthGuard`). `@Public()` dekoratörü yalnızca `POST /api/auth/login`, `GET /api`, `GET /api/health` üzerinde.
- **Seed kullanıcı:** `UsersService.onApplicationBootstrap` — yapılandırılan `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile yoksa tek panel kullanıcısı oluşturur (bcrypt hash, cost 10). Üretimde bu değerler değiştirilir ve repo içine konmaz.
- **Token saklama (istemci):** `sessionStorage`. Neden? Panel **oturum bazlı** olmalı; her yeni sekmede yeniden giriş beklenir. Bu, tarayıcı ele geçirildiğinde persistans yüzeyini daraltır. `localStorage` tercih edilseydi XSS saldırısında token kalıcı olurdu; `httpOnly` cookie alternatifi bu kapsam için fazladan altyapı (CSRF koruması, SameSite yapılandırması) gerektirirdi.
- **CORS:** `CORS_ORIGINS` yapılandırılır; `*` üretimde uyarı verir ve kapalıdır. Sadece `Authorization`, `Content-Type` header’ları geçerlidir; `credentials: false`.
- **Şifre güvenliği:** bcrypt (cost 10). Giriş yanıtında `Cache-Control: no-store`.
- **Gizli anahtarlar:** `JWT_SECRET`, `MONGODB_URI`, Atlas bağlantı dizgisi yalnızca platform ortam değişkenlerinde; repoda yalnızca `.env.example` şablonu mevcuttur.

---

## 9. Frontend mimarisi (Nuxt 3 + Pinia)

### 9.1 Sayfa haritası

| Rota | Amaç |
|------|------|
| `/login` | JWT ile oturum açma (iki kolonlu düzen, `public/img/iceberg.jpg`) |
| `/` | Dashboard: özet metrikler, aşama hunisi, son aktiviteler |
| `/transactions` | İşlem listesi + filtre |
| `/transactions/create` | Yeni işlem modalı / form |
| `/transactions/:id` | İşlem detayı, aşama ilerletme, tamamlanmışsa komisyon dökümü |
| `/agents` | Danışman listesi |
| `/agents/:id` | Danışman detay + performans kartı |
| `/reports` | Ajans özeti ve danışman bazlı kazanç raporu |

i18n stratejisi: `no_prefix` (URL sabit, dil cookie ile saklanır).

### 9.2 Pinia store’ları

| Store | Sorumluluk |
|-------|------------|
| `auth` | Login, logout, `sessionStorage` hidrasyonu, Bearer token servisi |
| `agents` | Liste, detay önbelleği, create / update / delete |
| `transactions` | Liste, detay, aşama güncelleme, oluşturma, silme, aktivite eşleştirme (`mapActivityLog`) |
| `ui` | Kenar çubuğu, modal durumu |
| `toast` | Başarı / hata bildirimleri (i18n başlıklı) |

Salt okunur rapor uçları (örn. `GET /transactions/:id/breakdown`, `GET /reports/*`) store’a bağlanmadan ilgili sayfalarda `authorizedFetch` ile çekilir; böylece store yüzeyi mutasyon odaklı kalır.

### 9.3 Uluslararasılaştırma

- `@nuxtjs/i18n` + `vue-i18n`; TR (varsayılan) ve EN tam kapsamlı.
- **Tüm** kullanıcıya dönük metin (hata mesajları, aşama etiketleri, aktivite açıklamaları, komisyon gerekçeleri, zaman formatları) i18n anahtarları üzerinden çözülür.
- Dinamik metinler için yardımcılar:
  - `composables/useDateTimeFormat` — `formatDateShort`, `timeAgo` (yerele duyarlı).
  - `utils/format-activity.ts` — `stageHistory` girdilerini `activity.stageChanged` / `activity.transactionCreated` anahtarlarına çevirir.
  - `utils/commission-reason.ts` — eski kayıtlardaki serbest metin `reason` değerlerini standart anahtarlara normalize eder.

### 9.4 Tema ve UI

- Tailwind CSS; marka paleti **lacivert `#0A1628` + altın `#D4A853`**.
- Tipografi: Inter (gövde) + Plus Jakarta Sans (başlık).
- Material Symbols Outlined (statik CDN).

---

## 10. Test stratejisi

- **Araç:** Jest (NestJS varsayılanı).
- **Birim testler (`npm test`):**
  - `TransactionsService` — geçerli / geçersiz tüm aşama geçişleri (matris test), `completed` → komisyon hesabı (her iki senaryo), `stageHistory` yazımı, `getBreakdown` ön koşulları.
  - `AgentsService` — e-posta çakışması, referanslı silmenin `errors.agentInUse` ile engellenmesi.
  - `ReportsService` — tamamlanmış işlemler üzerinden özet toplamlar, `fallback` akışı.
- **İstemci derlemesi:** `npm run build` (Nuxt) smoke test olarak kullanılır; tip hataları CI’da yakalanır.
- **Kapsam hedefi:** Kritik iş kuralları (§4, §5, §6) %100; CRUD katmanı ve controller’lar için testler NestJS’in built-in DI ile kolay genişletilebilir şekilde yazıldı.

---

## 11. Dağıtım ve operasyon

| Bileşen | Platform | Notlar |
|---------|----------|--------|
| API | Render (Web Service) | `npm ci && npm run build` → `node dist/main.js`. `NODE_ENV=production`, `SWAGGER_ENABLED` varsayılan kapalı. |
| Veritabanı | MongoDB Atlas | IP erişim listesi, ayrı kullanıcı. Yalnızca `MONGODB_URI` üzerinden erişim. |
| İstemci | Vercel (Nuxt 3) | `NUXT_PUBLIC_API_BASE` ortam değişkeni; `output: 'static'` veya SSR seçenekleri README’de açıklanır. |
| Sağlık | `GET /api/health` | Bağlantı ve uygulama canlılığı. |
| CORS | `CORS_ORIGINS` | Üretimde yalnızca Vercel kökü; `*` üretim için uyarı üretir. |
| Gizli anahtarlar | Platform secrets | Repoda sadece `.env.example`. |

---

## 12. Tasarım özgürlüğü matrisi

Case §5’te özgürce tasarlanması istenen her alan için verilen kararlar:

| Alan | Karar | Bu belgede |
|------|-------|------------|
| **Modül organizasyonu & servis yapısı** | Özellik bazlı modüller (`auth`, `users`, `agents`, `transactions`, `reports`); controller yalnızca HTTP sınırı, kural yalnızca service’te. | §2.3 |
| **Veritabanı şeması & iş mantığı ayrımı** | Mongoose şemaları kalıcılık tanımı; kural service katmanında (aşama makinesi, komisyon, silme kısıtı, duplicate e-posta). Komisyon dökümü **gömülü**. | §3, §5 |
| **API uç noktaları & frontend sayfa yapısı** | REST kaynak odaklı (`/api/agents`, `/api/transactions`, `/api/reports`); frontend aynı kaynakları ayna sayfalarla sunar (`/agents`, `/transactions`, `/reports`). | §7, §9.1, Ek B |
| **Hata yönetimi & doğrulama** | Global `ValidationPipe` + `class-validator` + `ParseMongoIdPipe`; tutarlı hata gövdesi filter ile; iş kuralı mesajları `errors.*` anahtarları, çeviri istemcide. | §7 |
| **Frontend UI/UX** | Marka paletli dashboard; aşama hunisi (drag-and-drop), detay ekranında ilerletme; finansal rapor sayfası; modal tabanlı oluşturma/silme; tüm metinler i18n. | §9 |

---

## Ek A — Hata anahtarları

Backend’in döndürdüğü tüm `errors.*` anahtarları (dil dosyalarında `frontend/i18n/locales/{tr,en}.json`):

| Anahtar | HTTP | Nerede? |
|---------|------|---------|
| `errors.invalidCredentials` | 401 | `AuthService.login` |
| `errors.authMissingToken`, `errors.authInvalidToken` | 401 | `JwtAuthGuard` |
| `errors.invalidObjectId` | 400 | `ParseMongoIdPipe` |
| `errors.emailInUse` | 400 | `AgentsService.create/update` (duplicate) |
| `errors.agentInUse` | 400 | `AgentsService.remove` (referanslı) |
| `errors.agentNotFound` | 404 | `AgentsService`, `ReportsService.getAgentReport` |
| `errors.transactionNotFound` | 404 | `TransactionsService` |
| `errors.invalidStageTransition` | 400 | `TransactionsService.updateStage` |
| `errors.breakdownNotReady` | 400 | `TransactionsService.getBreakdown` (henüz tamamlanmamış işlem) |
| `errors.listingAgentNotFound`, `errors.sellingAgentNotFound` | 400 | `TransactionsService.create` |

## Ek B — Uç nokta özeti

Tümü `/api` önekinde. Public olmayan tüm uçlar `Authorization: Bearer <jwt>` gerektirir.

| Metot & Yol | Açıklama | Erişim |
|-------------|----------|--------|
| `GET /` | Kök meta | Public |
| `GET /health` | Sağlık kontrolü | Public |
| `POST /auth/login` | JWT üretir | Public |
| `GET /agents` | Liste | JWT |
| `POST /agents` | Oluştur | JWT |
| `GET /agents/:id` | Detay | JWT |
| `PATCH /agents/:id` | Güncelle | JWT |
| `DELETE /agents/:id` | Sil (referans yoksa) | JWT |
| `GET /transactions` | Liste | JWT |
| `POST /transactions` | Oluştur (varsayılan `stage: agreement`) | JWT |
| `GET /transactions/:id` | Detay (populate edilmiş) | JWT |
| `PATCH /transactions/:id/stage` | Aşamayı **bir adım ileri** al | JWT |
| `GET /transactions/:id/breakdown` | Gömülü komisyon dökümü | JWT |
| `DELETE /transactions/:id` | Sil | JWT |
| `GET /reports/summary` | Ajans düzeyinde toplamlar | JWT |
| `GET /reports/agent/:id` | Danışman bazlı kazanç ve rol dağılımı | JWT |

— *Son revizyon: teslim sürümü.*
