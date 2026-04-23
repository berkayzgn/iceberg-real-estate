import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from './../src/common/filters/http-exception.filter';

async function buildApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  await app.init();
  return app;
}

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/estate-agency-e2e';
    }
  });

  beforeEach(async () => { app = await buildApp(); });
  afterEach(async () => { await app.close(); });

  it('GET /api/health → 200 ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => { expect(res.body.status).toBe('ok'); });
  });
});

describe('Agents + Transactions lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let agentId: string;
  let transactionId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/estate-agency-e2e';
    }
    app = await buildApp();
  });
  afterAll(async () => { await app.close(); });

  it('POST /api/agents → 201 creates agent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/agents')
      .send({ firstName: 'E2E', lastName: 'User', email: `e2e+${Date.now()}@test.com`, phone: '05001112233', title: 'Agent', specialization: 'Konut' })
      .expect(201);
    agentId = res.body._id as string;
    expect(agentId).toBeTruthy();
  });

  it('POST /api/agents with missing fields → 400', () => {
    return request(app.getHttpServer())
      .post('/api/agents')
      .send({ firstName: 'No' })
      .expect(400);
  });

  it('GET /api/agents/:id with invalid ObjectId → 400', () => {
    return request(app.getHttpServer())
      .get('/api/agents/not-an-id')
      .expect(400);
  });

  it('GET /api/agents/:id with nonexistent ObjectId → 404', () => {
    return request(app.getHttpServer())
      .get('/api/agents/000000000000000000000000')
      .expect(404);
  });

  it('POST /api/transactions → 201 creates transaction (stage=agreement)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transactions')
      .send({
        propertyAddress: 'E2E Test Mah. 1',
        propertyType: 'sale',
        transactionValue: 1_000_000,
        listingAgentId: agentId,
        sellingAgentId: agentId,
      })
      .expect(201);
    transactionId = res.body._id as string;
    expect(res.body.stage).toBe('agreement');
  });

  it('PATCH /api/transactions/:id/stage — invalid jump → 400', () => {
    return request(app.getHttpServer())
      .patch(`/api/transactions/${transactionId}/stage`)
      .send({ stage: 'completed' })
      .expect(400);
  });

  it('PATCH /api/transactions/:id/stage — agreement→earnest_money → 200', () => {
    return request(app.getHttpServer())
      .patch(`/api/transactions/${transactionId}/stage`)
      .send({ stage: 'earnest_money' })
      .expect(200)
      .expect((res) => { expect(res.body.stage).toBe('earnest_money'); });
  });

  it('PATCH /api/transactions/:id/stage — earnest_money→title_deed → 200', () => {
    return request(app.getHttpServer())
      .patch(`/api/transactions/${transactionId}/stage`)
      .send({ stage: 'title_deed' })
      .expect(200);
  });

  it('PATCH /api/transactions/:id/stage — title_deed→completed → 200 with breakdown', () => {
    return request(app.getHttpServer())
      .patch(`/api/transactions/${transactionId}/stage`)
      .send({ stage: 'completed' })
      .expect(200)
      .expect((res) => {
        expect(res.body.stage).toBe('completed');
        expect(res.body.commissionBreakdown).toBeDefined();
        expect(res.body.commissionBreakdown.agencyShare).toBe(500_000);
        expect(res.body.commissionBreakdown.sameAgent).toBe(true);
      });
  });

  it('GET /api/transactions/:id/breakdown → returns commission breakdown', () => {
    return request(app.getHttpServer())
      .get(`/api/transactions/${transactionId}/breakdown`)
      .expect(200)
      .expect((res) => {
        expect(res.body.agencyShare).toBe(500_000);
      });
  });

  it('GET /api/reports/summary → includes completed transaction', () => {
    return request(app.getHttpServer())
      .get('/api/reports/summary')
      .expect(200)
      .expect((res) => {
        expect(res.body.totalTransactions).toBeGreaterThanOrEqual(1);
        expect(res.body.currency).toBe('USD');
      });
  });

  it('GET /api/reports/agent/:id → returns agent report', () => {
    return request(app.getHttpServer())
      .get(`/api/reports/agent/${agentId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.completedTransactions).toBeGreaterThanOrEqual(1);
        expect(res.body.totalEarnings).toBe(500_000);
      });
  });

  it('DELETE /api/transactions/:id → 200', () => {
    return request(app.getHttpServer())
      .delete(`/api/transactions/${transactionId}`)
      .expect(200)
      .expect((res) => { expect(res.body.success).toBe(true); });
  });

  it('DELETE /api/agents/:id → 200', () => {
    return request(app.getHttpServer())
      .delete(`/api/agents/${agentId}`)
      .expect(200)
      .expect((res) => { expect(res.body.success).toBe(true); });
  });
});
