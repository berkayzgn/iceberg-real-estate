# Emlak — işlem & komisyon sistemi

Rehber: `docs/system-guide.md` · Yapılacaklar: `docs/PROJECT_TODOS.md`

## Dizin yapısı

| Klasör | Açıklama |
|--------|----------|
| `backend/` | **NestJS** API (`npm run start:dev`, önek `/api`) |
| `frontend/` | **Nuxt 3** (Aşama 13’te kurulacak) — şimdilik `frontend/README.md` |
| `src/` | Geçici **Vite + React** prototip (Nuxt tamamlanınca devre dışı bırakılacak) |

Atlas hazır olunca: `backend/.env.example` → `backend/.env`, `MONGODB_URI` ile bağla. Ayrıntı: `backend/README.md`.

---

## Web sayfası tasarımı (mevcut Vite prototip)

This is a code bundle for Web sayfası tasarımı. The original project is available at https://www.figma.com/design/c0zxJPZBTucnRPOIwh6tIZ/Web-sayfas%C4%B1-tasar%C4%B1m%C4%B1.

### Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.
  