# Tasarım dokümanı (DESIGN)

Bu belge, `docs/system-guide.md` kapsamındaki mimari ve tasarım kararlarını özetler. Kurulum ve canlı adresler için kök `README.md` dosyasına bakınız.

## 1. Mimari

| Katman | Teknoloji |
|--------|-----------|
| API | NestJS, TypeScript, MongoDB (Mongoose) |
| İstemci | Nuxt 3, Pinia, Tailwind CSS |

Veri akışı: istemci store’ları REST API çağırır; controller → service iş kuralını uygular; yanıt normalize edilerek arayüzde gösterilir.

## 2. Veri modeli

### 2.1 Agent

Alanlar: `firstName`, `lastName`, `email` (benzersiz), `phone`, `title`, `specialization`, `isActive`, zaman damgaları. API’de `fullName` sanal alanı kullanılabilir.

**Silme:** `DELETE /api/agents/:id` danışmanı kaldırır. En az bir işlemde `listingAgent` veya `sellingAgent` olarak geçen kayıt silinemez; bu durumda yanıt **HTTP 400** ve açıklayıcı mesaj döner. İstemci, işlem sayısı sıfır olan kartlarda / detayda silme eylemini gösterir.

### 2.2 Transaction

Alanlar: `propertyAddress`, `propertyType` (`sale` | `rental`), `transactionValue`, `stage`, `listingAgent` / `sellingAgent` referansları, `stageHistory[]`, tamamlanınca doldurulan `commissionBreakdown`, `completedAt`, zaman damgaları.

## 3. Komisyonun saklanması

**Karar:** `commissionBreakdown`, tamamlanmış işlemin dokümanına gömülü (embedded) kaydedilir.

**Gerekçe:** Döküm yalnızca ilgili işlemle anlamlıdır; tek sorguda işlem ve finansal sonuç döner; kural deterministik olduğundan tamamlanma anındaki anlık görüntü rapor tutarlılığını korur.

## 4. Aşama (stage) geçişleri

Sıra: `agreement` → `earnest_money` → `title_deed` → `completed`.

Yalnızca bir sonraki aşamaya geçişe izin verilir; geçersiz isteklerde HTTP `400` ve anlaşılır hata mesajı döner.

## 5. Komisyon politikası

- Toplam hizmet bedelinin %50’si ajansa, %50’si ajan(lar)a.
- Listing ve selling aynı kişiyse: ajan payının tamamı o kişiye.
- Farklı kişilerse: ajan payı listing ve selling arasında eşit bölünür (%25 / %25).

Kural backend servis katmanında uygulanır; birim testlerle doğrulanır (`npm test`).

## 6. API ve güvenlik

Genel önek: **`/api`**.

| Grup | Örnek uçlar |
|------|-------------|
| Sistem | `GET /api`, `GET /api/health` |
| Kimlik | `POST /api/auth/login` (JWT döner; diğer uçlar `Authorization: Bearer …` ister) |
| İş mantığı | `/api/agents`, `/api/transactions`, `/api/reports` |

**Kimlik doğrulama:** İlk çalıştırmada yapılandırılan `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile tek panel kullanıcısı yoksa oluşturulur (şifre bcrypt). İstemci, JWT’yi **`sessionStorage`** içinde tutar; **her tarayıcı sekmesi ayrı oturum** gerektirir (yeni sekmede doğrudan panele girilmez, yeniden giriş gerekir). Çıkışta token silinir ve ilgili Pinia önbelleği temizlenir.

Giriş yanıtı `Cache-Control: no-store` ile işaretlenir.

Doğrulama: DTO’lar ve global `ValidationPipe`. Hatalar: global exception filter ile `statusCode`, `timestamp`, `path`, `method`, `message` (ve gerektiğinde `errors[]`).

## 7. İstemci durumu (Pinia)

| Store | Sorumluluk |
|-------|------------|
| `auth` | Oturum aç/kapat, token |
| `agents` | Danışman listesi, oluşturma, silme |
| `transactions` | İşlemler, aşama güncelleme, oluşturma, silme |
| `ui` | Kenar çubuğu, modal vb. |
| `toast` | Bildirimler |

İşlemler ve danışmanlar için mutasyonlar store üzerinden yapılır. Salt okunur rapor uçları (ör. `breakdown`, `summary`, `agent/:id`) bazı sayfalarda doğrudan `authorizedFetch` ile çağrılabilir.

## 8. Arayüz özeti

Panel: özet metrikler, aşama hunisi, sürükle-bırak ile aşama güncelleme (desteklenmeyen geçişlerde uyarı). İşlem ve danışman oluşturma modalları. Danışman silme: yalnızca hiç işleme atanmamış danışmanlar (liste ve detay; onay ile).

## 9. Sınırlamalar ve olası geliştirmeler

- CORS: Geliştirmede boş `CORS_ORIGINS` yerel Nuxt portlarına izin verir; üretimde açık origin listesi gerekir.
- Soğuk başlatmalı barındırıcılar: İstemci açılışta `GET /api/health` ile hafif uyandırma yapabilir; gecikme tamamen ortadan kalkmaz.
- İleride: rol bazlı yetki, denetim günlüğü, E2E pipeline, merkezi sırlar yönetimi.

## 10. `system-guide.md` uyumu (özet)

| Madde | Durum |
|-------|--------|
| Stack (NestJS, MongoDB, Nuxt, Pinia, Tailwind) | Uygun |
| Aşamalar ve panel | Uygun |
| Finansal döküm | `commissionBreakdown` + raporlar |
| Komisyon + testler | Uygulama + `npm test` |
| Kaynak kod, DESIGN, README, canlı URL + Atlas | Repoda; operasyonel env kullanıcıya bağlı |

## 11. Uç ve rota referansı

**Backend** (tümü `/api` altında; Swagger: `/api/docs`, genelde üretimde kapalı):

- **Public:** `POST /auth/login`, `GET /` (kök meta), `GET /health`
- **Agents:** `GET|POST /agents`, `GET|PATCH /agents/:id`, `DELETE /agents/:id` (işlemde atanmış danışmanda `400`)
- **Transactions:** `GET|POST /transactions`, `GET|PATCH|DELETE /transactions/:id`, `PATCH /transactions/:id/stage`, `GET /transactions/:id/breakdown`
- **Reports:** `GET /reports/summary`, `GET /reports/agent/:id`  
  (JWT dışındaki uçlar Bearer gerektirir.)

**Frontend** (`i18n` stratejisi `no_prefix`):

`/login`, `/`, `/transactions`, `/transactions/create`, `/transactions/:id`, `/agents`, `/agents/:id`, `/reports`

**Ortam:** `NUXT_PUBLIC_API_BASE` üretimde tam API kökünü göstermeli (`…/api`). `MONGODB_URI` ve `JWT_SECRET` yalnızca sunucu ortamında; repoda yalnızca `.env.example` şablonu bulunur.
