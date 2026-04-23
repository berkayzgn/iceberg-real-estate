# DESIGN.md — Estate Agency Transaction Management System

Bu doküman, projedeki mimari ve tasarım kararlarını `docs/system-guide.md` gereksinimlerine göre özetler.

## 1. Mimari Özet

Sistem iki parçadan oluşur:

- Backend: NestJS + TypeScript + MongoDB Atlas (Mongoose)
- Frontend: Nuxt 3 + Pinia + Tailwind CSS

Yüksek seviyeli akış:

1. Frontend Pinia store'ları API çağrısı yapar.
2. Backend controller -> service akışıyla iş kuralını uygular.
3. MongoDB'den alınan veri normalize edilerek frontend'e döner.
4. UI state store'da tutulur, sayfalar store'dan render edilir.

## 2. Data Model Kararları

### 2.1 Agent modeli

Agent dokümanı şu alanları içerir:

- `firstName`, `lastName`
- `email` (unique)
- `phone`
- `title`
- `specialization`
- `isActive`
- `createdAt`, `updatedAt` (timestamps)

Tasarım gerekçesi:

- İşlem raporlarında agent kimliği temel varlık olduğundan bağımsız koleksiyonda tutuldu.
- `email` unique tutularak aynı danışmanın mükerrer açılması engellendi.
- `fullName` virtual alanı ile API tüketiminde kolaylık sağlandı.

### 2.2 Transaction modeli

Transaction dokümanı şu alanları içerir:

- `propertyAddress`
- `propertyType` (`sale` | `rental`)
- `transactionValue`
- `stage` (`agreement` | `earnest_money` | `title_deed` | `completed`)
- `listingAgent`, `sellingAgent` (Agent referansları)
- `stageHistory[]`
- `commissionBreakdown` (opsiyonel, completed olduğunda doldurulur)
- `completedAt`
- `createdAt`, `updatedAt`

Tasarım gerekçesi:

- İşlem akışını tek dokümanda toplayarak okunabilirlik ve operasyonel basitlik sağlandı.
- Stage geçmişi (`stageHistory`) ile denetlenebilirlik ve zaman çizelgesi üretimi kolaylaştırıldı.

## 3. Commission Saklama Stratejisi

Seçilen strateji: `commissionBreakdown` alanını `Transaction` dokümanına gömülü (embedded) saklamak.

Neden embedded?

- Breakdown sadece ilgili işlemle anlamlı; yaşam döngüsü transaction ile birebir bağlı.
- Tek sorguda işlem + finansal sonuç döndürülebiliyor.
- UI tarafında hızlı tüketim ve daha az API round-trip sağlıyor.
- Komisyon kuralı sistemde deterministik olduğu için completed anında snapshot almak rapor tutarlılığı sağlıyor.

Alternatiflerin değerlendirmesi:

- Ayrı koleksiyon: Raporlama esnekliği artsa da bu proje ölçeğinde gereksiz join ve karmaşıklık oluşturuyor.
- Tam dinamik hesaplama: Geçmişteki kural değişimlerinde tarihsel doğruluğu bozabilir.

## 4. Stage Geçiş Stratejisi

Desteklenen aşama sırası:

`agreement -> earnest_money -> title_deed -> completed`

Geçiş politikası:

- Yalnızca bir sonraki aşamaya geçişe izin verilir.
- Geçersiz geçişlerde backend `400` döner.
- Hata mesajı ham teknik ifade yerine kullanıcı dilinde açıklamalıdır.

Örnek:

- Desteklenmeyen geçiş: `agreement -> title_deed`
- Mesaj: "Bu işlem Anlaşma aşamasındayken doğrudan Tapu aşamasına geçirilemez. Önce Kapora aşamasına ilerletmelisiniz."

Bu yaklaşımın avantajları:

- Süreç disiplini korunur.
- Kullanıcı hataları erken yakalanır.
- Frontend tarafında açıklayıcı notification üretimi kolaylaşır.

## 5. Komisyon İş Kuralı

Kural:

- Toplam hizmet bedelinin `%50`si ajansa
- Kalan `%50`si ajan(lar)a

Senaryo A (tek ajan):

- `listingAgent == sellingAgent`
- Ajans: `%50`
- Ajan: `%50`

Senaryo B (farklı ajanlar):

- `listingAgent != sellingAgent`
- Ajans: `%50`
- Listing: `%25`
- Selling: `%25`

Bu mantık backend service katmanında uygulanır ve unit test ile doğrulanır.

## 6. API Tasarım Kararları

Temel endpoint grupları:

- `/api/agents`
- `/api/transactions`
- `/api/reports`

Kararlar:

- Controller sadece request/response sınırı, iş kuralı service içinde.
- DTO + ValidationPipe ile giriş validasyonu merkezi yapıldı.
- Global exception filter ile standart hata gövdesi döndürülüyor.

Standart hata gövdesi:

- `statusCode`
- `timestamp`
- `path`
- `method`
- `message`
- (opsiyonel) `errors[]`

## 7. Frontend State Yönetimi

Pinia store yapısı:

- `agents.store.ts`: danışman listesi ve create/remove işlemleri
- `transactions.store.ts`: işlem listesi, detay, stage update, create/remove
- `ui.store.ts`: modal/sidebar gibi saf UI state
- `toast.store.ts`: kullanıcı geri bildirimleri

State ilkeleri:

- API cache-benzeri davranış: `loaded` + `force` yaklaşımı
- Mapping katmanı: backend modeli -> frontend view model dönüştürme
- Sayfalar doğrudan HTTP çağırmak yerine store aksiyonlarını kullanır

Hata yönetimi:

- API hata gövdesi parse edilip kullanıcı dostu toast mesajına çevrilir.
- `400/404` gibi teknik başlıklar yerine anlamlı başlıklar gösterilir.

## 8. Dashboard ve UX Kararları

- Dashboard üstünde metrik kartları + stage funnel + activity alanı var.
- Drag-and-drop ile stage güncelleme desteklenir.
- Desteklenmeyen işlemlerde kullanıcıya açıklayıcı uyarı gösterilir.
- Modal bazlı işlem/danışman oluşturma ile akış hızlandırılır.

## 9. Trade-off ve Gelecek İyileştirmeler

Mevcut trade-off:

- CORS origin listesi dev ortam portlarına göre explicit tutuluyor.
- Breakdown completed anında snapshotlandığı için geçmiş tutarlılığı korunuyor, fakat kural değişiminde migration ihtiyacı doğabilir.

Önerilen geliştirmeler:

- Role-based authorization
- Audit log genişletme
- Deployment sonrası e2e smoke pipeline
- Üretim ortamı için merkezi config/secrets yönetimi
