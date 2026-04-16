# Proje yapılacaklar listesi (`system-guide.md`)

Bu dosya rehbere uygun geliştirmeyi **aşama aşama** takip etmek içindir. Tamamladıkça `[ ]` → `[x]` yapın.

---

## Aşama 0 — Hazırlık

- [x] Repo kökünde `backend/` ve `frontend/` (Nuxt) dizin yapısına karar verildi
- [ ] MongoDB Atlas: cluster, kullanıcı, network access, connection string hazır _(sen oluşturduktan sonra işaretle)_

---

## Aşama 1 — Backend iskelet (Rehber §4.1, Sprint Gün 1)

- [x] NestJS proje: `nest new backend` (veya monorepo içinde iskelet)
- [x] `@nestjs/config`, `@nestjs/mongoose`, `mongoose`, `class-validator`, `class-transformer`
- [x] `src/config/database.config.ts`, `app.config.ts`
- [x] `.env.example`: `MONGODB_URI`, `PORT`, (ileride `JWT_SECRET` vb.)
- [x] `AppModule` içinde Mongoose bağlantısı

---

## Aşama 2 — Ortak enum ve kurallar (Rehber §3, §4.2)

- [ ] `common/enums/transaction-stage.enum.ts`: `TransactionStage` + `VALID_TRANSITIONS`

---

## Aşama 3 — Agent modülü (Rehber §3, §4, §7)

- [ ] `modules/agents/schemas/agent.schema.ts` (firstName, lastName, email unique, phone, isActive, timestamps)
- [ ] `fullName` virtual
- [ ] DTO: create-agent, update-agent
- [ ] `AgentsService` + `AgentsController`
- [ ] API: `GET/POST/PATCH/DELETE /api/agents` ve `GET /api/agents/:id` (rehberdeki tabloya uygun prefix kullanın: `/api` global prefix önerilir)

---

## Aşama 4 — Transaction şeması (Rehber §3)

- [ ] `modules/transactions/schemas/transaction.schema.ts`
  - propertyAddress, propertyType, totalServiceFee (TL), stage
  - listingAgent, sellingAgent (ObjectId ref Agent)
  - commissionBreakdown (embedded), stageHistory[], notes, completedAt, timestamps

---

## Aşama 5 — Commission modülü (Rehber §6)

- [ ] `commission.calculator.ts` / `CommissionService.calculate()`
  - Senaryo 1: aynı danışman → ajans %50, tek danışman %50, selling 0
  - Senaryo 2: farklı danışman → ajans %50, listing %25, selling %25
- [ ] `commissionBreakdown` sadece **completed** geçişinde transaction’a yazılsın (rehber §4.2)

---

## Aşama 6 — Transactions servisi (Rehber §4.2)

- [ ] `create`: stage `AGREEMENT`, ilk `stageHistory` kaydı
- [ ] `findAll` / `findOne` + `populate('listingAgent sellingAgent')`
- [ ] `advanceStage`: `VALID_TRANSITIONS` kontrolü, geçersizse 400
- [ ] `stageHistory` push (changedAt, note)
- [ ] `nextStage === COMPLETED` → `commissionBreakdown` + `completedAt`

---

## Aşama 7 — Transaction API + DTO (Rehber §4.3, §7)

- [ ] `CreateTransactionDto`, `UpdateStageDto`, response DTO’lar (isteğe bağlı)
- [ ] `GET /api/transactions`, `GET /api/transactions/:id`
- [ ] `POST /api/transactions`
- [ ] `PATCH /api/transactions/:id/stage`
- [ ] `GET /api/transactions/:id/breakdown` (rehber §7)

---

## Aşama 8 — Reports (Rehber §7)

- [ ] `GET /api/reports/summary`
- [ ] `GET /api/reports/agent/:id`

---

## Aşama 9 — Kalite katmanı (Rehber §4.4, §8)

- [ ] Global `HttpExceptionFilter`
- [ ] Global `ValidationPipe`
- [ ] (İsteğe bağlı) `TransformInterceptor`

---

## Aşama 10 — Swagger (Rehber Sprint Gün 3)

- [ ] `@nestjs/swagger` kurulumu
- [ ] Controller/DTO dokümantasyonu
- [ ] `/api/docs` (veya seçtiğiniz path) erişilebilir

---

## Aşama 11 — Auth (Rehber mimari diyagramı: Auth modülü)

Rehberde detay yok; uygulama ihtiyacına göre doldurun:

- [ ] User şeması / strateji seçildi (JWT önerilir)
- [ ] Login / register veya sadece admin seed
- [ ] Korunan endpoint’lerde guard

---

## Aşama 12 — Backend testler (Rehber §8)

- [ ] `CommissionService` unit testleri (iki senaryo)
- [ ] `TransactionsService` stage transition testleri (agreement→earnest izin, agreement→title red, completed’ten geçiş yok, completed’te komisyon yazımı)

---

## Aşama 13 — Nuxt 3 frontend kurulum (Rehber §5.1–5.2)

- [ ] `npx nuxi@latest init frontend`
- [ ] `@pinia/nuxt`, `@nuxtjs/tailwindcss`
- [ ] `runtimeConfig.public.apiBase` → `.env` / `NUXT_PUBLIC_API_BASE`
- [ ] CORS / backend URL geliştirme ortamında doğrulandı

---

## Aşama 14 — Pinia + tipler (Rehber §5.3, §2 frontend)

- [ ] `stores/transactions.store.ts`
- [ ] `stores/agents.store.ts`
- [ ] `stores/ui.store.ts`
- [ ] `types/transaction.types.ts`, `types/agent.types.ts`

---

## Aşama 15 — Composables ve API (Rehber §5.3, §2)

- [ ] `composables/useTransaction.ts`
- [ ] `composables/useFormatCurrency.ts` (TL / rehberle uyumlu format)
- [ ] Tüm store aksiyonları `$fetch` ile gerçek API’ye bağlı

---

## Aşama 16 — Sayfalar (Rehber §2, §5.4)

- [ ] `pages/index.vue` — Dashboard (istatistikler, son işlemler, grafik)
- [ ] `pages/transactions/index.vue` — Liste
- [ ] `pages/transactions/[id].vue` — Detay + aşama geçişi
- [ ] `pages/transactions/create.vue` — Yeni işlem
- [ ] `pages/agents/index.vue`, `pages/agents/[id].vue`
- [ ] `pages/reports/index.vue`

---

## Aşama 17 — Bileşenler (Rehber §2 frontend dizin yapısı)

- [ ] `components/transaction/StageTracker.vue`
- [ ] `components/transaction/TransactionCard.vue`
- [ ] `components/transaction/FinancialBreakdown.vue`
- [ ] `components/transaction/StageTransitionBtn.vue`
- [ ] `components/agent/AgentCard.vue`
- [ ] `components/dashboard/StatCard.vue`, `RecentTransactions.vue`, `CommissionChart.vue`
- [ ] `components/shared/AppHeader.vue`, `AppSidebar.vue`, `LoadingSpinner.vue`

---

## Aşama 18 — Eski React / Vite prototipi

- [ ] Karar: `src/` (mevcut Vite+React) kaldırıldı mı, `legacy/` altına taşındı mı, yoksa repo ayrıldı mı?
- [ ] Tek “canlı” frontend: Nuxt `frontend/`

---

## Aşama 19 — Deployment (Rehber §9)

- [ ] Backend: Railway / Render (veya seçilen), `MONGODB_URI` prod
- [ ] Frontend: Vercel / Netlify, `NUXT_PUBLIC_API_BASE` prod API’ye işaret ediyor
- [ ] Canlı URL’ler README’de

---

## Aşama 20 — Dokümantasyon (Rehber §11–12, Sprint Gün 6)

- [ ] `DESIGN.md` — mimari kararlar (state machine, embedded commission, stageHistory, Pinia)
- [ ] `README.md` — kurulum, env, test komutları, live URLs
- [ ] `system-guide.md` ile çelişen yer varsa rehber veya bu dosya güncellendi

---

## İsteğe bağlı (rehberde yok; önceki prototipten devam edilecekse)

- [ ] Nuxt’ta çoklu dil (ör. `@nuxtjs/i18n`) — TR/EN

---

**Son güncelleme:** Dosya oluşturuldu; ilerledikçe burayı güncel tutun.
