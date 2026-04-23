import { NotFoundException } from '@nestjs/common';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';
import { ReportsService } from './reports.service';

type MockTransactionModel = { find: jest.Mock };
type MockAgentModel = { findById: jest.Mock };

const completedBreakdown = {
  agencyShare: 500_000,
  agentTotal: 500_000,
  listingAgentShare: 250_000,
  sellingAgentShare: 250_000,
  sameAgent: false,
  reason: 'Listing and selling agents are different.',
};

const sameAgentBreakdown = {
  agencyShare: 500_000,
  agentTotal: 500_000,
  listingAgentShare: 500_000,
  sellingAgentShare: 0,
  sameAgent: true,
  reason: 'Same agent handles both roles.',
};

function buildCompletedTxn(override: Record<string, unknown> = {}) {
  return {
    _id: 'txn-1',
    propertyAddress: 'Test Mah. 1',
    transactionValue: 1_000_000,
    stage: TransactionStage.COMPLETED,
    listingAgent: 'agent-1',
    sellingAgent: 'agent-2',
    commissionBreakdown: completedBreakdown,
    completedAt: new Date('2024-06-01'),
    ...override,
  };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let transactionModel: MockTransactionModel;
  let agentModel: MockAgentModel;

  beforeEach(() => {
    transactionModel = { find: jest.fn() };
    agentModel = { findById: jest.fn() };
    service = new ReportsService(transactionModel as never, agentModel as never);
  });

  // ─── getSummary ───────────────────────────────────────────────────────────
  describe('getSummary', () => {
    it('returns zero totals when no completed transactions', async () => {
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      const result = await service.getSummary();
      expect(result.totalTransactions).toBe(0);
      expect(result.totalServiceFee).toBe(0);
      expect(result.totalAgencyShare).toBe(0);
      expect(result.totalAgentPayout).toBe(0);
      expect(result.currency).toBe('USD');
    });

    it('aggregates a single completed transaction correctly', async () => {
      const txn = buildCompletedTxn();
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([txn]) });

      const result = await service.getSummary();
      expect(result.totalTransactions).toBe(1);
      expect(result.totalServiceFee).toBe(1_000_000);
      expect(result.totalAgencyShare).toBe(500_000);
      expect(result.totalAgentPayout).toBe(500_000);
    });

    it('uses fallback breakdown when commissionBreakdown is missing', async () => {
      const txn = buildCompletedTxn({ commissionBreakdown: null });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([txn]) });

      const result = await service.getSummary();
      expect(result.totalAgencyShare).toBe(500_000);
    });

    it('aggregates multiple transactions', async () => {
      const txns = [buildCompletedTxn(), buildCompletedTxn({ _id: 'txn-2' })];
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(txns) });

      const result = await service.getSummary();
      expect(result.totalTransactions).toBe(2);
      expect(result.totalServiceFee).toBe(2_000_000);
    });
  });

  // ─── getAgentReport ───────────────────────────────────────────────────────
  describe('getAgentReport', () => {
    const agent = {
      _id: 'agent-1',
      firstName: 'Ali',
      lastName: 'Veli',
      email: 'ali@test.com',
    };

    it('throws NotFoundException when agent does not exist', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.getAgentReport('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns empty report when no completed transactions', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.getAgentReport('agent-1');
      expect(result.completedTransactions).toBe(0);
      expect(result.totalEarnings).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });

    it('calculates listing agent earnings correctly', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });
      const txn = buildCompletedTxn({ listingAgent: 'agent-1', sellingAgent: 'agent-2' });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([txn]) });

      const result = await service.getAgentReport('agent-1');
      expect(result.totalEarnings).toBe(250_000);
      expect(result.roles.listing).toBe(1);
      expect(result.transactions[0]?.role).toBe('listing');
    });

    it('calculates selling agent earnings correctly', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });
      const txn = buildCompletedTxn({ listingAgent: 'agent-99', sellingAgent: 'agent-1' });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([txn]) });

      const result = await service.getAgentReport('agent-1');
      expect(result.totalEarnings).toBe(250_000);
      expect(result.roles.selling).toBe(1);
      expect(result.transactions[0]?.role).toBe('selling');
    });

    it('calculates dual-role agent earnings (same agent) correctly', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });
      const txn = buildCompletedTxn({
        listingAgent: 'agent-1',
        sellingAgent: 'agent-1',
        commissionBreakdown: sameAgentBreakdown,
      });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([txn]) });

      const result = await service.getAgentReport('agent-1');
      expect(result.totalEarnings).toBe(500_000);
      expect(result.roles.dual).toBe(1);
      expect(result.transactions[0]?.role).toBe('dual');
    });

    it('returns currency as USD', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });
      transactionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.getAgentReport('agent-1');
      expect(result.currency).toBe('USD');
    });
  });
});
