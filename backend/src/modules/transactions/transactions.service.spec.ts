import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';
import { TransactionsService } from './transactions.service';

type MockTransactionModel = {
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

type MockAgentModel = {
  exists: jest.Mock;
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionModel: MockTransactionModel;
  let agentModel: MockAgentModel;

  beforeEach(() => {
    transactionModel = {
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    agentModel = {
      exists: jest.fn(),
    };

    service = new TransactionsService(
      transactionModel as never,
      agentModel as never,
    );
  });

  describe('updateStage — valid transitions', () => {
    const validPairs: Array<[TransactionStage, TransactionStage]> = [
      [TransactionStage.AGREEMENT, TransactionStage.EARNEST_MONEY],
      [TransactionStage.EARNEST_MONEY, TransactionStage.TITLE_DEED],
      [TransactionStage.TITLE_DEED, TransactionStage.COMPLETED],
    ];

    it.each(validPairs)('%s → %s is allowed', async (from, to) => {
      const save = jest.fn().mockResolvedValue(undefined);
      const txnDoc = {
        stage: from,
        stageHistory: [],
        transactionValue: 500_000,
        listingAgent: 'a1',
        sellingAgent: 'a2',
        completedAt: undefined,
        commissionBreakdown: undefined,
        save,
      };
      transactionModel.findById.mockResolvedValue(txnDoc);
      jest.spyOn(service, 'findOne').mockResolvedValue({ _id: 'x', commissionBreakdown: null } as never);

      await expect(service.updateStage('txn-x', { stage: to })).resolves.toBeDefined();
      expect(save).toHaveBeenCalled();
    });
  });

  describe('updateStage — invalid transitions', () => {
    const invalidPairs: Array<[TransactionStage, TransactionStage]> = [
      [TransactionStage.AGREEMENT, TransactionStage.TITLE_DEED],
      [TransactionStage.AGREEMENT, TransactionStage.COMPLETED],
      [TransactionStage.EARNEST_MONEY, TransactionStage.AGREEMENT],
      [TransactionStage.EARNEST_MONEY, TransactionStage.COMPLETED],
      [TransactionStage.TITLE_DEED, TransactionStage.AGREEMENT],
      [TransactionStage.TITLE_DEED, TransactionStage.EARNEST_MONEY],
      [TransactionStage.COMPLETED, TransactionStage.AGREEMENT],
      [TransactionStage.COMPLETED, TransactionStage.EARNEST_MONEY],
      [TransactionStage.COMPLETED, TransactionStage.TITLE_DEED],
    ];

    it.each(invalidPairs)('%s → %s is rejected', async (from, to) => {
      transactionModel.findById.mockResolvedValue({
        stage: from,
        stageHistory: [],
        save: jest.fn(),
      });

      await expect(service.updateStage('txn-x', { stage: to })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateStage', () => {
    it('rejects invalid transition (legacy)', async () => {
      transactionModel.findById.mockResolvedValue({
        stage: TransactionStage.AGREEMENT,
        stageHistory: [],
        save: jest.fn(),
      });

      await expect(
        service.updateStage('txn-1', { stage: TransactionStage.COMPLETED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('calculates 50/50 split for same agent on completed', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const txnDoc = {
        stage: TransactionStage.TITLE_DEED,
        stageHistory: [],
        transactionValue: 1_000_000,
        listingAgent: 'agent-1',
        sellingAgent: 'agent-1',
        completedAt: undefined,
        commissionBreakdown: undefined,
        save,
      };

      transactionModel.findById.mockResolvedValue(txnDoc);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        _id: 'txn-1',
        commissionBreakdown: null,
      } as never);

      await service.updateStage('txn-1', {
        stage: TransactionStage.COMPLETED,
      });

      expect(save).toHaveBeenCalled();
      expect(txnDoc.commissionBreakdown).toMatchObject({
        agencyShare: 500000,
        agentTotal: 500000,
        listingAgentShare: 500000,
        sellingAgentShare: 0,
        sameAgent: true,
        reason: 'same_agent',
      });
      expect(txnDoc.completedAt).toBeInstanceOf(Date);
    });

    it('calculates 50/25/25 split for different agents on completed', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const txnDoc = {
        stage: TransactionStage.TITLE_DEED,
        stageHistory: [],
        transactionValue: 1_000_000,
        listingAgent: 'agent-1',
        sellingAgent: 'agent-2',
        completedAt: undefined,
        commissionBreakdown: undefined,
        save,
      };

      transactionModel.findById.mockResolvedValue(txnDoc);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        _id: 'txn-1',
        commissionBreakdown: null,
      } as never);

      await service.updateStage('txn-1', {
        stage: TransactionStage.COMPLETED,
      });

      expect(txnDoc.commissionBreakdown).toMatchObject({
        agencyShare: 500000,
        agentTotal: 500000,
        listingAgentShare: 250000,
        sellingAgentShare: 250000,
        sameAgent: false,
        reason: 'different_agents',
      });
      expect(txnDoc.stageHistory).toHaveLength(1);
    });
  });

  describe('getBreakdown', () => {
    it('throws when transaction is not completed yet', async () => {
      transactionModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'txn-2',
          commissionBreakdown: null,
        }),
      });

      await expect(service.getBreakdown('txn-2')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns breakdown for completed transaction', async () => {
      const breakdown = {
        agencyShare: 500000,
        agentTotal: 500000,
        listingAgentShare: 250000,
        sellingAgentShare: 250000,
        sameAgent: false,
        reason: 'test',
      };

      transactionModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'txn-3',
          commissionBreakdown: breakdown,
        }),
      });

      await expect(service.getBreakdown('txn-3')).resolves.toEqual(breakdown);
    });
  });

  describe('remove', () => {
    it('deletes and returns success payload', async () => {
      transactionModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'txn-del-1' }),
      });

      await expect(service.remove('txn-del-1')).resolves.toEqual({
        success: true,
        id: 'txn-del-1',
      });
    });

    it('throws not found when id does not exist', async () => {
      transactionModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
