# Emlak — işlem & komisyon sistemi

Rehber: `docs/system-guide.md` · Yapılacaklar: `docs/PROJECT_TODOS.md`

## Dizin yapısı

| Klasör | Açıklama |
|--------|----------|
| `backend/` | **NestJS** API (`npm run start:dev`, önek `/api`, varsayılan port **3002**) |
| `frontend/` | **Nuxt 3** + Pinia + Tailwind (`npm run dev`) — canlı arayüz |

Atlas: `backend/.env.example` → `backend/.env` (`MONGODB_URI`). Ayrıntı: `backend/README.md`, `frontend/README.md`.

## Çalıştırma

```bash
# API
cd backend && npm install && cp -n .env.example .env && npm run start:dev

# Arayüz (ayrı terminal)
cd frontend && npm install && cp -n .env.example .env && npm run dev
```
