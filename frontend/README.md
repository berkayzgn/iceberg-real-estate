# Frontend — Iceberg Digital admin panel (Nuxt 3) *(English)*

Nuxt 3 admin UI: transaction funnel, agent management, financial reports. **Pinia** (state), **Tailwind CSS** (styling), **`@nuxtjs/i18n`** (TR / EN). API calls: `runtimeConfig.public.apiBase` + `authorizedFetch` (JWT `Authorization` header).

Architecture and page–API mapping: **`docs/DESIGN.md`**. Monorepo root: **`README.md`**.

## Requirements

- **Node.js** 20+ (per `package.json` `engines`)
- A running **backend** reachable at `NUXT_PUBLIC_API_BASE`

## Setup

```bash
cd frontend
cp -n .env.example .env
# NUXT_PUBLIC_API_BASE example: http://localhost:3002/api
npm install
npm run dev
```

Dev server is usually **`http://localhost:3000`** (Nuxt may pick another free port).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_API_BASE` | Backend root **including `/api`**. Local: `http://localhost:3002/api`. Production: `https://<api-host>/api` |

This value is **embedded at build time**; after changing it on Vercel, **rebuild**. See **`.env.example`**.

The backend must list the site origin in **`CORS_ORIGINS`**.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (CI / Vercel) |
| `npm run preview` | Preview after build |
| `npm run generate` | Static generation (if needed) |

## Session & security

- **Login:** `/login`. Credentials match `ADMIN_EMAIL` / `ADMIN_PASSWORD` on the backend (seed on first boot; see `backend/.env.example`).
- **JWT:** Returned in the response body, not in the URL.
- **Storage:** **`sessionStorage`** — one session per tab; new tab requires sign-in again. Sign out from the sidebar.
- Use **HTTPS** in production.

## Features (summary)

- Dashboard: summary metrics, stage funnel (drag-and-drop for allowed transitions only)
- Transactions: list, create, detail, advance stage, commission breakdown when completed
- Agents: CRUD; delete only when not referenced by any transaction
- Reports: agency summary and per-agent earnings
- All user-facing copy via **i18n** (`i18n/locales/tr.json`, `en.json`); backend `errors.*` keys translated on the client

## Vercel

- **Root directory:** `frontend`
- **Environment:** `NUXT_PUBLIC_API_BASE` = production API URL (e.g. `https://<render-app>.onrender.com/api`)
- After deploy, add the Vercel origin to backend **`CORS_ORIGINS`**

Example live URLs are in the root **`README.md`**.

## Quality check

```bash
npm run build
```

Run locally or in CI to catch type and build errors.

---

# Frontend — Iceberg Digital Panel (Nuxt 3)

Nuxt 3 ile geliştirilmiş yönetim paneli: işlem hunisi, danışman yönetimi, finansal raporlar. **Pinia** (durum), **Tailwind CSS** (stil), **`@nuxtjs/i18n`** (TR / EN). API ile iletişim: `runtimeConfig.public.apiBase` + `authorizedFetch` (JWT `Authorization` başlığı).

Mimari ve sayfa–API eşlemesi: **`docs/DESIGN.md`**. Monorepo kökü: **`README.md`**.

## Gereksinimler

- **Node.js** 20+ (`package.json` `engines` ile uyumlu)
- Çalışan **backend** (`NUXT_PUBLIC_API_BASE` ile aynı ortamda erişilebilir olmalı)

## Kurulum

```bash
cd frontend
cp -n .env.example .env
# NUXT_PUBLIC_API_BASE örnek: http://localhost:3002/api
npm install
npm run dev
```

Geliştirme adresi genelde **`http://localhost:3000`** (müsait port Nuxt tarafından seçilebilir).

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `NUXT_PUBLIC_API_BASE` | Backend kökü **/api dahil**. Yerel: `http://localhost:3002/api`. Üretim: `https://<api-host>/api` |

Bu değer **build zamanında** istemci paketine gömülür; Vercel’de değiştirdikten sonra **yeniden build** gerekir. Ayrıntı: **`.env.example`**.

Backend tarafında ilgili kök **`CORS_ORIGINS`** içinde tanımlı olmalıdır.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (CI / Vercel) |
| `npm run preview` | Build sonrası yerel önizleme |
| `npm run generate` | Statik üretim (gerekirse) |

## Oturum ve güvenlik

- **Giriş:** `/login`. Kimlik bilgileri backend’deki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile eşleşir (ilk çalıştırmada seed; örnekler `backend/.env.example` ile uyumlu).
- **JWT:** Yanıt gövdesinde döner; URL’de taşınmaz.
- **Saklama:** **`sessionStorage`** — sekme başına oturum; yeni sekmede tekrar giriş gerekir. Çıkış kenar çubuğundan.
- Üretimde **HTTPS** kullanın.

## Özellikler (özet)

- Dashboard: özet metrikler, işlem aşaması hunisi (sürükle-bırak ile izin verilen geçişler)
- İşlemler: liste, oluşturma, detay, aşama ilerletme, tamamlanan işlemde komisyon dökümü
- Danışmanlar: CRUD; yalnızca işleme atanmamış kayıtlar silinebilir
- Raporlar: ajans özeti ve danışman bazlı kazanç
- Tüm kullanıcı metinleri **i18n** (`i18n/locales/tr.json`, `en.json`); backend hata anahtarları `errors.*` istemcide çevrilir

## Vercel

- **Root directory:** `frontend`
- **Environment:** `NUXT_PUBLIC_API_BASE` = üretim API adresi (örn. `https://<render-app>.onrender.com/api`)
- Deploy sonrası backend **`CORS_ORIGINS`** listesine Vercel kökünü ekleyin

Canlı örnek URL’ler kök **`README.md`** içindedir.

## Kalite kontrol

```bash
npm run build
```

Tip ve derleme hatalarını yakalamak için yerel veya CI’da çalıştırın.
