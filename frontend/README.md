# Frontend (Nuxt 3)

Nuxt 3, Pinia, Tailwind, `@nuxtjs/i18n`. API: `runtimeConfig.public.apiBase` + `authorizedFetch` (JWT `Authorization` başlığı).

## Kurulum

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Geliştirme: `http://localhost:3000` (veya müsait port). `NUXT_PUBLIC_API_BASE` örnek: `http://localhost:3002/api`.

## Oturum

- Giriş: `/login`. Form boş açılır; örnek kullanıcı kök `README.md` ve `backend/.env.example` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile aynıdır.
- JWT yanıt gövdesinde döner; URL’de taşınmaz. Tarayıcıda **`sessionStorage`** kullanılır: **yeni sekmede** oturum paylaşılmaz, tekrar giriş gerekir. Çıkış sidebar’dan.
- Üretimde HTTPS kullanın.

## Vercel

Root directory: `frontend`. Build env: `NUXT_PUBLIC_API_BASE` = üretim API kökü (örn. `https://<api-host>/api`). Değişiklikten sonra yeniden derleyin.

Backend `CORS_ORIGINS` listesine Vercel kökünü ekleyin.
