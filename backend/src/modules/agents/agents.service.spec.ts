import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';

type MockAgentModel = {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

type MockTransactionModel = {
  countDocuments: jest.Mock;
};

function buildMockAgentModel(): MockAgentModel {
  return {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
}

function buildMockTransactionModel(): MockTransactionModel {
  return {
    countDocuments: jest.fn().mockResolvedValue(0),
  };
}

describe('AgentsService', () => {
  let service: AgentsService;
  let agentModel: MockAgentModel;
  let transactionModel: MockTransactionModel;

  beforeEach(() => {
    agentModel = buildMockAgentModel();
    transactionModel = buildMockTransactionModel();
    service = new AgentsService(agentModel as never, transactionModel as never);
  });

  // ─── create ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates and returns the new agent document', async () => {
      const dto = { firstName: 'Ali', lastName: 'Veli', email: 'ali@test.com', phone: '0500', title: 'Agent', specialization: 'Konut' };
      const created = { _id: 'agent-1', ...dto };
      agentModel.create.mockResolvedValue(created);

      await expect(service.create(dto as never)).resolves.toEqual(created);
      expect(agentModel.create).toHaveBeenCalledWith(dto);
    });

    it('throws BadRequestException on duplicate email (code 11000)', async () => {
      agentModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.create({} as never)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('re-throws unknown errors', async () => {
      const unknownError = new Error('DB down');
      agentModel.create.mockRejectedValue(unknownError);

      await expect(service.create({} as never)).rejects.toThrow('DB down');
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns sorted agent list', async () => {
      const list = [{ _id: 'a1' }, { _id: 'a2' }];
      agentModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(list) }) });

      await expect(service.findAll()).resolves.toEqual(list);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('returns agent when found', async () => {
      const agent = { _id: 'a1', email: 'a@b.com' };
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(agent) });

      await expect(service.findOne('a1')).resolves.toEqual(agent);
    });

    it('throws NotFoundException when not found', async () => {
      agentModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────
  describe('update', () => {
    it('returns updated agent', async () => {
      const updated = { _id: 'a1', email: 'new@b.com' };
      agentModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

      await expect(service.update('a1', { email: 'new@b.com' } as never)).resolves.toEqual(updated);
    });

    it('throws NotFoundException when agent does not exist', async () => {
      agentModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.update('missing', {} as never)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException on duplicate email (code 11000)', async () => {
      agentModel.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockRejectedValue({ code: 11000 }) });

      await expect(service.update('a1', {} as never)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('returns success payload on deletion', async () => {
      agentModel.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'a1' }) });

      await expect(service.remove('a1')).resolves.toEqual({ success: true, id: 'a1' });
      expect(transactionModel.countDocuments).toHaveBeenCalledWith({
        $or: [{ listingAgent: 'a1' }, { sellingAgent: 'a1' }],
      });
    });

    it('throws BadRequestException when agent is assigned to a transaction', async () => {
      transactionModel.countDocuments.mockResolvedValue(1);

      await expect(service.remove('a1')).rejects.toBeInstanceOf(BadRequestException);
      expect(agentModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when agent does not exist', async () => {
      agentModel.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
