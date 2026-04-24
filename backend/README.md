# Estate Agency API (NestJS)

Backend API; mimari ve uçlar `docs/DESIGN.md`.

## Gereksinimler

- Node.js 20+
- MongoDB (yerel veya [MongoDB Atlas](https://www.mongodb.com/atlas))

## Kurulum

```bash
cd backend
cp .env.example .env
# .env içinde MONGODB_URI: Atlas oluşturduğunuzda connection string'i yapıştırın
npm install
```

## Çalıştırma

```bash
npm run start:dev
```

- API öneki: **`/api`** (ör. `http://localhost:3002/api/health`)
- Varsayılan port: **3002** (`PORT` ile değişir)

## Test

```bash
npm run test          # unit (Mongo gerekmez)
npm run test:e2e      # e2e — çalışan bir MongoDB gerekir (varsayılan URI: 127.0.0.1)
```

## Ortam değişkenleri

| Değişken       | Açıklama                          |
|----------------|-----------------------------------|
| `MONGODB_URI`  | Zorunlu — Mongo connection string |
| `JWT_SECRET`   | Zorunlu üretimde — JWT imza anahtarı |
| `JWT_EXPIRES_SECONDS` | Opsiyonel — token ömrü (saniye), varsayılan `604800` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | İlk çalıştırmada seed edilen panel kullanıcısı |
| `CORS_ORIGINS` | Opsiyonel — virgülle ayrılmış origin listesi (örn. `https://my-app.vercel.app`). Boşsa local Nuxt portları (3000/3001) izinlidir. |
| `PORT`         | Opsiyonel, varsayılan `3002`      |
| `NODE_ENV`     | `development` / `production`    |

`POST /api/auth/login` ile `{ "email", "password" }` gönderildiğinde `accessToken` döner; diğer uçlar `Authorization: Bearer …` ister.
