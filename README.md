# Emlak işlem ve komisyon yönetimi

Monorepo: NestJS API (`backend/`) ve Nuxt 3 arayüzü (`frontend/`). Mimari ve veri modeli: `docs/DESIGN.md`.

## Dizin yapısı

| Klasör | İçerik |
|--------|--------|
| `backend/` | REST API, global önek `/api`, varsayılan port `3002` |
| `frontend/` | Web uygulaması (Pinia, Tailwind) |
| `docs/` | `DESIGN.md` |

## Yerel çalıştırma

```bash
cd backend && npm install && cp -n .env.example .env && npm run start:dev
cd frontend && npm install && cp -n .env.example .env && npm run dev
```

`backend/.env`: `MONGODB_URI` zorunlu. `frontend/.env`: `NUXT_PUBLIC_API_BASE` (örn. `http://localhost:3002/api`).

## Panel girişi

`/login` için kullanıcı, backend ortamındaki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ile oluşturulur (ilk çalıştırmada seed). Örnek varsayılanlar `backend/.env.example` ile uyumludur. Üretimde bu değerleri değiştirin.

## Örnek canlı ortam

| Bileşen | Örnek URL |
|---------|-----------|
| API (Render) | `https://iceberg-real-estate.onrender.com` |
| Sağlık | `GET …/api/health` |
| Arayüz (Vercel) | `https://iceberg-real-estate.vercel.app` |

Üretimde: Vercel’de `NUXT_PUBLIC_API_BASE` ayarlandıktan sonra yeniden build gerekir. Render’da `CORS_ORIGINS` içine Vercel kökü eklenmelidir. Ayrıntı: `backend/README.md`, `frontend/README.md`.

## Güvenlik notu

Repoda paylaşılmaz: Atlas connection string, barındırıcı hesap şifreleri, `JWT_SECRET` ve diğer gizli anahtarlar; yalnızca platform ortam değişkenleri / secrets kullanılır.

## Test

```bash
cd backend && npm test
cd frontend && npm run build
```
