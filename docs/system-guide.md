# System Guide — Estate Agency Transaction Management System

## 1. Ana Problem

Bir emlak danışmanlığı şirketi olarak, bir mülkün satış veya kiralama anlaşması yapıldıktan sonra başlayan süreç kritik öneme sahiptir. Mevcut süreç (kapora, tapu, ödemeler vb.) büyük ölçüde manüel olarak ve farklı araçlarla takip edilmektedir.

İşlem tamamlandıktan sonra toplam hizmet ücretinin (komisyon) şirket ve ajanlar arasında dağıtımı, karmaşık kurallar nedeniyle hem zaman alıcı hem de insan hatalarına açıktır.

---

## 2. Beklenen Çözüm

Aşağıdaki yeteneklere sahip bir **backend + frontend sistemi** tasarlanıp geliştirilmesi beklenmektedir:

- Bir işlemin yaşam döngüsünü baştan sona takip etmek
- Toplam hizmet ücretini ajans ve ajanlara otomatik olarak dağıtmak
- Herhangi bir işlem için net bir finansal döküm sunmak
- Sistemle etkileşime izin veren API'leri sunmak ve tüketmek

---

## 3. Teknik Stack (Zorunlu)

### Backend

| Teknoloji                            | Durum    |
| ------------------------------------ | -------- |
| Node.js (LTS)                        | Zorunlu  |
| TypeScript                           | Zorunlu  |
| NestJS                               | Zorunlu  |
| MongoDB Atlas                        | Zorunlu  |
| Mongoose veya MongoDB Node.js Driver | Zorunlu  |
| Jest                                 | Önerilir |

### Frontend

| Teknoloji                | Durum    |
| ------------------------ | -------- |
| Nuxt 3                   | Zorunlu  |
| Pinia (State Management) | Zorunlu  |
| Tailwind CSS             | Önerilir |

---

## 4. Temel Kurallar ve Senaryolar

### 4.1 İşlem Aşamaları (Transaction Stages)

Her işlem belirli aşamalardan geçer:

```
agreement → earnest_money → title_deed → completed
```

**Gereksinimler:**

- Her işlemin aşaması takip edilmelidir
- Aşama geçişlerine izin verilmelidir
- Frontend, bu geçişleri görselleştiren ve tetikleyen bir **dashboard** sunmalıdır
- Geçersiz geçişler isteğe bağlı olarak engellenebilir (karar `DESIGN.md`'de açıklanmalıdır)

---

### 4.2 Finansal Döküm (Financial Breakdown)

Tamamlanan her işlem için şunlar net biçimde raporlanmalıdır:

- Ajansın ne kadar kazandığı
- Her ajanın ne kadar kazandığı
- Neden o miktarı kazandıkları (listing agent / selling agent rolleri)

**Saklama Yöntemi Seçenekleri** (birini seçin, `DESIGN.md`'de gerekçelendirin):

- Transaction dokümanına gömülü olarak
- Ayrı bir koleksiyonda
- Dinamik olarak hesaplanarak

---

### 4.3 Komisyon Politikası

> **Toplam hizmet ücretinin %50'si ajansa aittir.**  
> **Kalan %50 ilgili ajanlar arasında paylaşılır.**

#### Senaryo 1 — Tek Ajan

Listing agent ve selling agent **aynı kişiyse**, o ajan ajan payının tamamını alır:

```
Ajans  → %50
Ajan   → %50 (listing = selling)
```

#### Senaryo 2 — Farklı Ajanlar

Listing agent ve selling agent **farklı kişilerse**, ajan payı eşit bölünür:

```
Ajans          → %50
Listing Agent  → %25
Selling Agent  → %25
```

> ⚠️ Bu kurallar hem kodda hem de **unit testlerde** uygulanmalıdır.

---

## 5. Tasarım Özgürlükleri

Aşağıdaki konularda tam özgürlük tanınmıştır (tüm kararlar `DESIGN.md`'de açıklanmalıdır):

- **Modül organizasyonu & Servis yapısı**
- **Veritabanı şeması & İş mantığı ayrımı**
- **API endpoint'leri & Frontend sayfa yapısı**
- **Hata yönetimi & Validasyon yapısı** (DTO'lar, pipe'lar vb.)
- **Frontend UI/UX:** İşlem takibi ve finansal raporlar için dashboard tasarımı

---

## 6. Teslim Edilecekler

| #   | Teslim          | Açıklama                                                                    |
| --- | --------------- | --------------------------------------------------------------------------- |
| 6.1 | **Source Code** | Backend ve frontend klasörlerini içeren public Git repository               |
| 6.2 | **Unit Tests**  | Backend için zorunlu: komisyon kuralları, aşama geçişleri, temel iş mantığı |
| 6.3 | **DESIGN.md**   | Mimari, veri modelleri ve frontend state yönetimini açıklayan doküman       |
| 6.4 | **README.md**   | Her iki proje için kurulum ve çalıştırma talimatları                        |
| 6.5 | **Deployment**  | Canlı API URL'si + Canlı Frontend URL'si (MongoDB Atlas kullanılmalı)       |

---

## 7. Değerlendirme Kriterleri

1. **Problem Analizi & Veri Modelleme**
2. **Sistem Tasarımı & Mimari**
3. **Kod Kalitesi & İş Mantığı**
4. **Test & Deployment**

---

## 8. Notlar

- Stack dışına çıkmak **değerlendirmeyi olumsuz etkiler**
- Süre serbesttir; ancak **hem geçen süre hem de kalite** birlikte değerlendirilir
- Bu bir kodlama egzersizinden öte bir **mühendislik ve tasarım meydan okumasıdır**
- Mimari kararlar ve backend-frontend uyumu özellikle incelenecektir
