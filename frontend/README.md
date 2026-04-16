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

İlk açılışta `/login` → **Demo ile devam et** (çerez tabanlı demo oturumu).
