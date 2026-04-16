🏠 Estate Agency Transaction Management System — Geliştirme Rehberi
NestJS + MongoDB Atlas + Nuxt 3 ile geliştirilecek komisyon ve işlem takip sistemi

📋 İçindekiler

1. Proje Genel Bakış
2. Mimari Tasarım
3. Veri Modelleri
4. Backend Geliştirme (NestJS)
5. Frontend Geliştirme (Nuxt 3)
6. Komisyon Hesaplama Mantığı
7. API Endpoint Tasarımı
8. Test Stratejisi
9. Deployment Planı
10. Geliştirme Süreci ve Sprint Planı
11. DESIGN.md Taslağı
12. README.md Taslağı

13. Proje Genel Bakış
    Problem
    Bir gayrimenkul danışmanlık firmasının satış/kiralama sürecini uçtan uca dijitalleştirmek:

- Anlaşma → kapora → tapu → tamamlandı aşamalarının takibi
- Toplam hizmet bedelinin (komisyon) ajans ve danışmanlar arasında otomatik dağıtımı
- Finansal şeffaflık ve izlenebilirlik
  Çözüm Bileşenleri
  ┌─────────────────────────────────────────────┐
  │ Nuxt 3 Frontend │
  │ Dashboard | Transactions | Reports │
  └──────────────────┬──────────────────────────┘
  │ HTTP / REST
  ┌──────────────────▼──────────────────────────┐
  │ NestJS Backend │
  │ Auth | Transactions | Agents | Commission │
  └──────────────────┬──────────────────────────┘
  │ Mongoose ODM
  ┌──────────────────▼──────────────────────────┐
  │ MongoDB Atlas │
  │ transactions | agents | users │
  └─────────────────────────────────────────────┘

2. Mimari Tasarım
   Backend Modül Yapısı
   src/
   ├── app.module.ts
   ├── main.ts
   ├── config/
   │ ├── database.config.ts
   │ └── app.config.ts
   ├── modules/
   │ ├── agents/
   │ │ ├── agents.module.ts
   │ │ ├── agents.controller.ts
   │ │ ├── agents.service.ts
   │ │ ├── dto/
   │ │ │ ├── create-agent.dto.ts
   │ │ │ └── update-agent.dto.ts
   │ │ └── schemas/
   │ │ └── agent.schema.ts
   │ ├── transactions/
   │ │ ├── transactions.module.ts
   │ │ ├── transactions.controller.ts
   │ │ ├── transactions.service.ts
   │ │ ├── dto/
   │ │ │ ├── create-transaction.dto.ts
   │ │ │ ├── update-stage.dto.ts
   │ │ │ └── transaction-response.dto.ts
   │ │ └── schemas/
   │ │ └── transaction.schema.ts
   │ └── commission/
   │ ├── commission.module.ts
   │ ├── commission.service.ts
   │ └── commission.calculator.ts
   └── common/
   ├── filters/
   │ └── http-exception.filter.ts
   ├── pipes/
   │ └── validation.pipe.ts
   ├── interceptors/
   │ └── transform.interceptor.ts
   └── enums/
   └── transaction-stage.enum.ts
   Frontend Dizin Yapısı
   frontend/
   ├── nuxt.config.ts
   ├── app.vue
   ├── pages/
   │ ├── index.vue # Dashboard
   │ ├── transactions/
   │ │ ├── index.vue # İşlem listesi
   │ │ ├── [id].vue # İşlem detayı
   │ │ └── create.vue # Yeni işlem
   │ ├── agents/
   │ │ ├── index.vue # Danışman listesi
   │ │ └── [id].vue # Danışman detayı
   │ └── reports/
   │ └── index.vue # Finansal raporlar
   ├── components/
   │ ├── transaction/
   │ │ ├── StageTracker.vue # Aşama göstergesi
   │ │ ├── TransactionCard.vue
   │ │ ├── FinancialBreakdown.vue
   │ │ └── StageTransitionBtn.vue
   │ ├── agent/
   │ │ └── AgentCard.vue
   │ ├── dashboard/
   │ │ ├── StatCard.vue
   │ │ ├── RecentTransactions.vue
   │ │ └── CommissionChart.vue
   │ └── shared/
   │ ├── AppHeader.vue
   │ ├── AppSidebar.vue
   │ └── LoadingSpinner.vue
   ├── stores/
   │ ├── transactions.store.ts
   │ ├── agents.store.ts
   │ └── ui.store.ts
   ├── composables/
   │ ├── useTransaction.ts
   │ └── useFormatCurrency.ts
   └── types/
   ├── transaction.types.ts
   └── agent.types.ts

3. Veri Modelleri
   Agent Schema
   // schemas/agent.schema.ts
   import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
   import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: true })
export class Agent {
@Prop({ required: true })
firstName: string;

@Prop({ required: true })
lastName: string;

@Prop({ required: true, unique: true })
email: string;

@Prop()
phone?: string;

@Prop({ default: true })
isActive: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

// Virtual: fullName
AgentSchema.virtual('fullName').get(function () {
return `${this.firstName} ${this.lastName}`;
});
Transaction Schema
// schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
@Prop({ required: true })
propertyAddress: string;

@Prop({ required: true })
propertyType: string; // 'sale' | 'rental'

@Prop({ required: true })
totalServiceFee: number; // Toplam komisyon tutarı (TL)

@Prop({
type: String,
enum: TransactionStage,
default: TransactionStage.AGREEMENT,
})
stage: TransactionStage;

@Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
listingAgent: Types.ObjectId; // İlan danışmanı

@Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
sellingAgent: Types.ObjectId; // Satış danışmanı

@Prop({ type: Object })
commissionBreakdown?: {
agencyShare: number; // %50 ajans payı
listingAgentShare: number; // Liste danışmanı payı
sellingAgentShare: number; // Satış danışmanı payı
isSameAgent: boolean; // Aynı danışman mı?
};

@Prop({ type: [{ stage: String, changedAt: Date, note: String }] })
stageHistory: Array<{
stage: string;
changedAt: Date;
note?: string;
}>;

@Prop()
notes?: string;

@Prop()
completedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionStage Enum
// common/enums/transaction-stage.enum.ts
export enum TransactionStage {
AGREEMENT = 'agreement',
EARNEST_MONEY = 'earnest_money',
TITLE_DEED = 'title_deed',
COMPLETED = 'completed',
}

// Geçerli aşama geçişleri (State Machine)
export const VALID_TRANSITIONS: Record<TransactionStage, TransactionStage[]> = {
[TransactionStage.AGREEMENT]: [TransactionStage.EARNEST_MONEY],
[TransactionStage.EARNEST_MONEY]: [TransactionStage.TITLE_DEED],
[TransactionStage.TITLE_DEED]: [TransactionStage.COMPLETED],
[TransactionStage.COMPLETED]: [], // Terminal state
};

4. Backend Geliştirme (NestJS)
   4.1 Kurulum
   npm i -g @nestjs/cli
   nest new backend
   cd backend

# Gerekli paketler

npm install @nestjs/mongoose mongoose
npm install @nestjs/config
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express

# Dev bağımlılıkları

npm install -D @types/mongoose jest @nestjs/testing
4.2 TransactionService — Temel İşlemler
// transactions.service.ts
@Injectable()
export class TransactionsService {
constructor(
@InjectModel(Transaction.name)
private readonly transactionModel: Model<TransactionDocument>,
private readonly commissionService: CommissionService,
) {}

async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
const transaction = new this.transactionModel({
...dto,
stage: TransactionStage.AGREEMENT,
stageHistory: [{ stage: TransactionStage.AGREEMENT, changedAt: new Date() }],
});
return transaction.save();
}

async findAll(): Promise<TransactionDocument[]> {
return this.transactionModel
.find()
.populate('listingAgent sellingAgent')
.exec();
}

async findOne(id: string): Promise<TransactionDocument> {
const transaction = await this.transactionModel
.findById(id)
.populate('listingAgent sellingAgent')
.exec();
if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
return transaction;
}

async advanceStage(id: string, dto: UpdateStageDto): Promise<TransactionDocument> {
const transaction = await this.findOne(id);
const currentStage = transaction.stage as TransactionStage;
const validNext = VALID_TRANSITIONS[currentStage];

    if (!validNext.includes(dto.nextStage)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStage}" to "${dto.nextStage}"`,
      );
    }

    transaction.stage = dto.nextStage;
    transaction.stageHistory.push({
      stage: dto.nextStage,
      changedAt: new Date(),
      note: dto.note,
    });

    // İşlem tamamlandıysa komisyonu hesapla ve kaydet
    if (dto.nextStage === TransactionStage.COMPLETED) {
      transaction.commissionBreakdown = this.commissionService.calculate(transaction);
      transaction.completedAt = new Date();
    }

    return transaction.save();

}
}
4.3 DTO Örnekleri
// dto/create-transaction.dto.ts
import { IsString, IsNumber, IsMongoId, IsOptional, IsPositive } from 'class-validator';

export class CreateTransactionDto {
@IsString()
propertyAddress: string;

@IsString()
propertyType: string;

@IsNumber()
@IsPositive()
totalServiceFee: number;

@IsMongoId()
listingAgent: string;

@IsMongoId()
sellingAgent: string;

@IsOptional()
@IsString()
notes?: string;
}

// dto/update-stage.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';

export class UpdateStageDto {
@IsEnum(TransactionStage)
nextStage: TransactionStage;

@IsOptional()
@IsString()
note?: string;
}
4.4 Global Exception Filter
// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
catch(exception: HttpException, host: ArgumentsHost) {
const ctx = host.switchToHttp();
const response = ctx.getResponse<Response>();
const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message,
    });

}
}

5. Frontend Geliştirme (Nuxt 3)
   5.1 Kurulum
   npx nuxi@latest init frontend
   cd frontend

npm install @pinia/nuxt pinia
npm install @nuxtjs/tailwindcss
npm install axios
5.2 nuxt.config.ts
export default defineNuxtConfig({
modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
runtimeConfig: {
public: {
apiBase: process.env.API_BASE_URL || 'http://localhost:3001/api',
},
},
});
5.3 Pinia Store — Transactions
// stores/transactions.store.ts
import { defineStore } from 'pinia';
import type { Transaction, CreateTransactionPayload } from '~/types/transaction.types';

export const useTransactionsStore = defineStore('transactions', {
state: () => ({
transactions: [] as Transaction[],
currentTransaction: null as Transaction | null,
loading: false,
error: null as string | null,
}),

getters: {
completedTransactions: (state) =>
state.transactions.filter((t) => t.stage === 'completed'),

    totalCommissionEarned: (state) =>
      state.transactions
        .filter((t) => t.stage === 'completed')
        .reduce((sum, t) => sum + (t.commissionBreakdown?.agencyShare ?? 0), 0),

},

actions: {
async fetchAll() {
this.loading = true;
try {
const config = useRuntimeConfig();
const data = await $fetch<Transaction[]>(`${config.public.apiBase}/transactions`);
this.transactions = data;
} catch (err: any) {
this.error = err.message;
} finally {
this.loading = false;
}
},

    async advanceStage(id: string, nextStage: string, note?: string) {
      const config = useRuntimeConfig();
      const updated = await $fetch<Transaction>(`${config.public.apiBase}/transactions/${id}/stage`, {
        method: 'PATCH',
        body: { nextStage, note },
      });
      const index = this.transactions.findIndex((t) => t._id === id);
      if (index !== -1) this.transactions[index] = updated;
      this.currentTransaction = updated;
    },

},
});
5.4 Temel Sayfa Yapısı
Dashboard (pages/index.vue)

- Toplam işlem sayısı stat kartı
- Tamamlanan işlemler sayısı
- Toplam ajans komisyonu
- Aktif işlem listesi (son 5)
- Aşama dağılımı (bar/donut chart)
  İşlem Detay (pages/transactions/[id].vue)
- Aşama göstergesi (StageTracker — yatay stepper)
- Finansal breakdown kartı
- Danışman bilgileri
- "Sonraki Aşamaya Geç" butonu
- Aşama geçmiş tablosu
  Raporlar (pages/reports/index.vue)
- Tamamlanan işlemleri filtrele
- Danışman bazlı komisyon tablosu
- Toplam ajans geliri

6.  Komisyon Hesaplama Mantığı
    Kurallar
    Senaryo Listing Agent Selling Agent Ajans Payı Listing Agent Payı Selling Agent Payı
    Senaryo 1 A A (aynı) %50 %50 —
    Senaryo 2 A B (farklı) %50 %25 %25
    Uygulama
    // commission/commission.calculator.ts
    @Injectable()
    export class CommissionService {
    calculate(transaction: TransactionDocument): CommissionBreakdown {
    const { totalServiceFee, listingAgent, sellingAgent } = transaction;

        const agencyShare = totalServiceFee * 0.5;
        const agentPool   = totalServiceFee * 0.5;

        const isSameAgent =
          listingAgent.toString() === sellingAgent.toString();

        const listingAgentShare = isSameAgent ? agentPool : agentPool * 0.5;
        const sellingAgentShare = isSameAgent ? 0         : agentPool * 0.5;

        return {
          agencyShare,
          listingAgentShare,
          sellingAgentShare,
          isSameAgent,
        };

    }
    }

7.  API Endpoint Tasarımı
    Agents
    Method Endpoint Açıklama
    GET /api/agents Tüm danışmanları listele
    GET /api/agents/:id Danışman detayı
    POST /api/agents Yeni danışman oluştur
    PATCH /api/agents/:id Danışman güncelle
    DELETE /api/agents/:id Danışman sil
    Transactions
    Method Endpoint Açıklama
    GET /api/transactions Tüm işlemleri listele
    GET /api/transactions/:id İşlem detayı (populate)
    POST /api/transactions Yeni işlem oluştur
    PATCH /api/transactions/:id/stage Aşama geçişi yap
    GET /api/transactions/:id/breakdown Komisyon dökümü
    Reports
    Method Endpoint Açıklama
    GET /api/reports/summary Genel özet (toplam işlem, komisyon)
    GET /api/reports/agent/:id Danışman bazlı komisyon raporu
8.  Test Stratejisi
    Zorunlu Unit Test Senaryoları
    // commission/commission.service.spec.ts
    describe('CommissionService', () => {
    let service: CommissionService;

beforeEach(async () => {
const module = await Test.createTestingModule({
providers: [CommissionService],
}).compile();
service = module.get<CommissionService>(CommissionService);
});

describe('Senaryo 1 — Aynı danışman', () => {
it('listing ve selling agent aynıysa agent %50 almalı', () => {
const agentId = new Types.ObjectId();
const result = service.calculate({
totalServiceFee: 10000,
listingAgent: agentId,
sellingAgent: agentId,
} as any);

      expect(result.agencyShare).toBe(5000);
      expect(result.listingAgentShare).toBe(5000);
      expect(result.sellingAgentShare).toBe(0);
      expect(result.isSameAgent).toBe(true);
    });

});

describe('Senaryo 2 — Farklı danışmanlar', () => {
it('iki farklı danışman %25 paylaşmalı', () => {
const result = service.calculate({
totalServiceFee: 10000,
listingAgent: new Types.ObjectId(),
sellingAgent: new Types.ObjectId(),
} as any);

      expect(result.agencyShare).toBe(5000);
      expect(result.listingAgentShare).toBe(2500);
      expect(result.sellingAgentShare).toBe(2500);
      expect(result.isSameAgent).toBe(false);
    });

});
});

// transactions/transactions.service.spec.ts
describe('TransactionsService — Stage Transitions', () => {
it('agreement -> earnest_money geçişine izin vermeli');
it('agreement -> title_deed geçişini reddetmeli');
it('completed aşamasından herhangi bir geçişi reddetmeli');
it('completed aşamasına geçince komisyonu hesaplamalı');
});
Test Komutu

# Unit testler

npm run test

# Coverage raporu

npm run test:cov

9. Deployment Planı
   Backend — Railway / Render

# Ortam değişkenleri

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/estate-agency
PORT=3001
NODE_ENV=production
Frontend — Vercel / Netlify

# .env

NUXT_PUBLIC_API_BASE=https://your-backend-url.railway.app/api
MongoDB Atlas Konfigürasyonu

1. Atlas'ta proje oluştur
2. M0 (ücretsiz) cluster aç
3. Network Access: 0.0.0.0/0 ekle (veya deployment IP'si)
4. Database User oluştur
5. Connection string'i MONGODB_URI olarak set et

6. Geliştirme Süreci ve Sprint Planı
   Gün 1 — Backend Temel

- [ ] NestJS proje iskeletini oluştur
- [ ] MongoDB Atlas bağlantısını kur
- [ ] Agent schema + CRUD endpoint'leri
- [ ] Transaction schema + temel CRUD
      Gün 2 — İş Mantığı
- [ ] TransactionStage enum ve state machine
- [ ] advanceStage servisi + geçiş validasyonu
- [ ] CommissionService ve iki senaryo implementasyonu
- [ ] Exception filter + validation pipe
      Gün 3 — Testler + API Tamamlama
- [ ] CommissionService unit testleri
- [ ] TransactionsService unit testleri (stage transitions)
- [ ] Reports endpoint'leri
- [ ] Swagger dokümantasyonu (@nestjs/swagger)
      Gün 4 — Frontend Temel
- [ ] Nuxt 3 + Pinia + Tailwind kurulumu
- [ ] Layout (header + sidebar)
- [ ] Dashboard sayfası + stat kartları
- [ ] İşlem listesi sayfası
      Gün 5 — Frontend Detay Sayfaları
- [ ] İşlem detay sayfası
- [ ] StageTracker bileşeni (stepper)
- [ ] FinancialBreakdown bileşeni
- [ ] Yeni işlem formu
- [ ] Raporlar sayfası
      Gün 6 — Deployment + Dokümantasyon
- [ ] Backend deployment (Railway/Render)
- [ ] Frontend deployment (Vercel)
- [ ] DESIGN.md yaz
- [ ] README.md yaz
- [ ] Son testler ve bug fix

11. DESIGN.md Taslağı

# DESIGN.md

## Mimari Kararlar

### Stage Geçişleri

State machine pattern kullandım. `VALID_TRANSITIONS` map'i ile sadece
geçerli geçişlere izin verilir. Invalid geçişler 400 BadRequest döner.

### Komisyon Depolama Stratejisi

Komisyon dökümü `commissionBreakdown` alanı olarak transaction dökümanına
gömülü (embedded) olarak saklanır. Bunun nedeni:

- Komisyon kuralları değişse bile geçmiş kayıtlar korunur
- Tek sorgu ile tüm finansal bilgiye ulaşılır
- Ayrı collection gerektirmez

### Stage History

Her aşama geçişinde `stageHistory` dizisine kayıt eklenir.
Bu tam izlenebilirlik sağlar.

## Frontend Mimari

### State Management

Pinia store'lar feature bazında ayrıldı (transactions, agents, ui).
Her store kendi API çağrılarını yönetir.

### API Katmanı

`$fetch` (Nuxt built-in) kullanıldı. API base URL runtime config üzerinden
gelir, bu sayede environment bazında değiştirilebilir.

12. README.md Taslağı

# Estate Agency Transaction System

## Prerequisites

- Node.js 20+
- MongoDB Atlas hesabı

## Backend Kurulum

\`\`\`bash
cd backend
npm install
cp .env.example .env

# .env dosyasına MONGODB_URI ekle

npm run start:dev
\`\`\`

## Frontend Kurulum

\`\`\`bash
cd frontend
npm install
cp .env.example .env

# .env dosyasına NUXT_PUBLIC_API_BASE ekle

npm run dev
\`\`\`

## Testler

\`\`\`bash
cd backend
npm run test
npm run test:cov
\`\`\`

## Live URLs

- API: https://...
- Frontend: https://...
- API Docs (Swagger): https://.../api/docs

Not: Bu döküman geliştirme boyunca güncel tutulmalıdır. Tasarım kararları uygulandıkça DESIGN.md dosyası detaylandırılmalıdır.
