# Proje yapılacaklar listesi (`system-guide.md`)

Bu dosya rehbere uygun geliştirmeyi **öncelik sırasıyla** takip etmek içindir.  
Tamamladıkça `[ ]` → `[x]` yapın.

---

## P0 — İlk Başlangıç (Bugün)

### P0.1 MongoDB Atlas kurulumu (ilk adım)
- [x] Atlas projesi oluştur
- [x] M0/M2 cluster oluştur (region seç)
- [x] Database user oluştur (readWrite)
- [x] Network Access: geliştirme için IP izin ver (`0.0.0.0/0` sadece geçici)
- [x] Connection string al (`mongodb+srv://...`)
- [ ] `backend/.env.example` oluştur (README referans veriyor ama dosya repoda yok)
- [x] `backend/.env` içine `MONGODB_URI` ekle
- [x] `npm run start` ile backend ayağa kalkıyor (Mongo bağlıyken doğrulanmalı)

### P0.2 Temel altyapı doğrulama
- [x] Repo yapısı: `backend/` + `frontend/`
- [x] Backend NestJS iskeleti ve config dosyaları
- [x] Frontend Nuxt 3 + Pinia + Tailwind kurulumu
- [x] Frontend dashboard/işlemler/danışmanlar/raporlar temel akışları

---

## P1 — Backend Domain ve API (System Guide ana kapsam)

### P1.1 Agent modülü
- [x] `Agent` schema (name, email unique, phone, title, specialization, timestamps)
- [x] DTO: `CreateAgentDto`, `UpdateAgentDto`
- [x] `AgentsService` + `AgentsController`
- [x] Endpointler: `GET /api/agents`, `GET /api/agents/:id`, `POST`, `PATCH`, `DELETE`

### P1.2 Transaction modülü
- [x] `Transaction` schema:
  - [x] `propertyAddress`, `propertyType`, `transactionValue`, `stage`
  - [x] `listingAgentId`, `sellingAgentId` (Agent ref)
  - [x] `stageHistory[]`, `completedAt`
  - [x] `commissionBreakdown` (seçilen stratejiye göre)
- [x] Create transaction: başlangıç stage `agreement`
- [x] List/detail transaction endpointleri
- [x] Stage geçiş endpointi + valid transition kontrolü

### P1.3 Komisyon politikası (zorunlu iş kuralı)
- [x] Tek ajan senaryosu: `%50 ajans / %50 ajan`
- [x] Farklı ajan senaryosu: `%50 ajans / %25 listing / %25 selling`
- [x] Breakdown üretimi ve transaction ile ilişkilendirme
- [x] `GET /api/transactions/:id/breakdown`

### P1.4 Rapor endpointleri
- [x] `GET /api/reports/summary`
- [x] `GET /api/reports/agent/:id`

---

## P2 — Frontend’i gerçek API’ye bağlama

### P2.1 Store entegrasyonu
- [x] `stores/transactions.store.ts` içindeki demo seed yerine backend fetch
- [x] `stores/agents.store.ts` create/list akışını backend ile eşle
- [x] Drag-drop stage update → backend `PATCH /transactions/:id/stage`
- [x] Create transaction modal → backend `POST /transactions`

### P2.2 Sayfa entegrasyonu
- [x] Dashboard metrikleri backend verisinden
- [x] Transactions list/detail backend verisinden
- [x] Agents list/detail backend verisinden
- [x] Reports backend verisinden

### P2.3 UI durum yönetimi
- [x] Loading/empty/error state standardı
- [x] API hata mesajları toast/inline olarak gösterilsin

---

## P3 — Kalite, Test, Dokümantasyon

### P3.1 Backend kalite
- [x] Global `ValidationPipe`
- [x] Global `HttpExceptionFilter`
- [x] Swagger (`/api/docs`)

### P3.2 Unit testler (zorunlu)
- [x] Komisyon hesaplama testleri (2 ana senaryo)
- [x] Stage transition testleri (valid/invalid)
- [x] Transaction service temel iş mantığı testleri

### P3.3 Teslim dokümanları
- [x] `DESIGN.md`:
  - [x] data model kararları
  - [x] commission saklama stratejisi (embedded/ayrı/dinamik) + gerekçe
  - [x] stage geçiş stratejisi
  - [x] frontend state yönetimi
- [ ] `README.md`:
  - [x] backend/frontend kurulum
  - [x] env değişkenleri
  - [x] test komutları
  - [x] canlı URL’ler (API URL eklendi; Vercel URL deploy sonrası eklenecek)

---

## P4 — Deployment
- [x] Backend deployment (Render/Railway vb.)
- [ ] Frontend deployment (Vercel/Netlify vb.)
- [ ] Prod env değişkenleri (Render: `MONGODB_URI` + `CORS_ORIGINS` (Vercel domain))
- [ ] E2E smoke test (create transaction -> stage transition -> breakdown/report)

---

## Son sprintte yapılan önemli işler (tamamlandı)
- [x] Dashboard aşama hunisi drag-drop
- [x] Dashboard kart sadeleştirme (sparkline/trend kaldırıldı)
- [x] Dil seçici UX iyileştirmeleri
- [x] Danışman ekleme modalı + işlem formundan “+ Yeni ekle...”
- [x] `legacy/` klasörü temizliği
- [x] MongoDB bağlantısının `estate-agenty` veritabanına taşınması ve veri kopyalama
- [x] Danışman kartlarında responsive taşma düzeltmeleri
- [x] Yeni danışman modalında `ünvan/uzmanlık` alanlarını seçim listesine çevirme
- [x] Backend’de global exception filter + Swagger (`/api/docs`) kurulumu
- [x] Transaction service için unit testler (komisyon + stage geçiş + breakdown)
- [x] Para birimi gösterimi USD yapıldı (frontend format + reports currency metadata)
- [x] İşlem detayında “Ref: <id>” UI’dan kaldırıldı
- [x] Backend TypeScript `ignoreDeprecations` ayarı düzeltildi (TS5103 fix)

---

**Son güncelleme:** Backend/Frontend API entegrasyonu ve son UI+DB düzenlemeleri işlendi.
