# Frontend (Nuxt 3)

`docs/system-guide.md` ile uyumlu: **Nuxt 3**, **Pinia** (`@pinia/nuxt`), **Tailwind** (`@nuxtjs/tailwindcss`), API için **`$fetch` / `useFetch`** ve `runtimeConfig.public.apiBase`.

## Kurulum

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Varsayılan geliştirme adresi: `http://localhost:3000` · API: `NUXT_PUBLIC_API_BASE` (ör. `http://localhost:3002/api`).

Uygulama doğrudan dashboard ile açılır; ayrı bir login ekranı bulunmaz.

## Vercel (production) deploy

Vercel’de proje **root directory** olarak `frontend` seçilmelidir (repo monorepo).

Vercel Environment Variables:

- `NUXT_PUBLIC_API_BASE`: render’daki API kökü + `/api` (ör. `https://iceberg-real-estate.onrender.com/api`)

Render (backend) tarafında CORS:

- `CORS_ORIGINS`: Vercel domain(ler)in (virgülle birden fazla)
  - production: `https://<project>.vercel.app` (ve/veya custom domain)
  - preview URL’ler için de ayrıca eklemen gerekebilir
