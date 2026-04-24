# Emlak işlem ve komisyon yönetimi

Monorepo: NestJS API (`backend/`) ve Nuxt 3 arayüzü (`frontend/`). Gereksinim özeti: `docs/system-guide.md`. Mimari ayrıntı: `docs/DESIGN.md`.

## Dizin yapısı

| Klasör | İçerik |
|--------|--------|
| `backend/` | REST API, global önek `/api`, varsayılan port `3002` |
| `frontend/` | Web uygulaması (Pinia, Tailwind) |
| `docs/` | `system-guide.md`, `DESIGN.md` |

## Yerel çalıştırma

```bash
cd backend && npm install && cp -n .env.example .env && npm run start:dev
cd frontend && npm install && cp -n .env.example .env && npm run dev
```

`backend/.env`: `MONGODB_URI` zorunlu. `frontend/.env`: `NUXT_PUBLIC_API_BASE` (örn. `http://localhost:3002/api`).

## Panel giriş bilgileri

Web arayüzü (`/login`) için kullanıcı, backend ortamındaki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ile oluşturulur (ilk çalıştırmada seed). **Örnek varsayılanlar** (`backend/.env.example` ile uyumlu):

| Alan | Örnek değer |
|------|-------------|
| E-posta | `admin@icebergdigital.com` |
| Şifre | `admin1234` |

Üretimde bu değerleri mutlaka değiştirin; teslimatta güncel bilgiyi güvenli kanal veya dağıtım notu ile paylaşın.

## Canlı ortam (örnek)

| Bileşen | Örnek URL |
|---------|-----------|
| API (Render) | `https://iceberg-real-estate.onrender.com` |
| Sağlık | `GET …/api/health` |
| Arayüz (Vercel) | `https://iceberg-real-estate.vercel.app` |

Üretimde: Vercel’de `NUXT_PUBLIC_API_BASE` ayarlandıktan sonra **yeniden build** gerekir. Render’da `CORS_ORIGINS` içine Vercel kökü eklenmelidir. Ayrıntı: `backend/README.md`, `frontend/README.md`.

## Teslim notları

- Değerlendirici repoyu klonlar; canlı adresler yukarıdaki gibi README üzerinden duyurulur (`docs/system-guide.md`, canlı URL bölümü).
- Panel erişimi: backend’in seed ettiği yönetici (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Bu **uygulama** hesabıdır; teslim mesajında paylaşılabilir.
- **Paylaşılmaz:** Atlas connection string, barındırıcı hesap şifreleri, `JWT_SECRET`, diğer gizli anahtarlar (yalnızca platform env / secrets).

## Test

```bash
cd backend && npm test
cd frontend && npm run build
```
