# Estate Agency API (NestJS)

`docs/system-guide.md` rehberine uygun backend.

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

- API öneki: **`/api`** (ör. `http://localhost:3001/api/health`)
- Varsayılan port: **3001** (`PORT` ile değişir)

## Test

```bash
npm run test          # unit (Mongo gerekmez)
npm run test:e2e      # e2e — çalışan bir MongoDB gerekir (varsayılan URI: 127.0.0.1)
```

## Ortam değişkenleri

| Değişken       | Açıklama                          |
|----------------|-----------------------------------|
| `MONGODB_URI`  | Zorunlu — Mongo connection string |
| `PORT`         | Opsiyonel, varsayılan `3001`      |
| `NODE_ENV`     | `development` / `production`    |
