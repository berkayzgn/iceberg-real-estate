import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async create(dto: CreateAgentDto) {
    try {
      return await this.agentModel.create(dto);
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.agentModel.find().sort({ createdAt: -1 }).lean({ virtuals: true });
  }

  async findOne(id: string) {
    const agent = await this.agentModel.findById(id).lean({ virtuals: true });
    if (!agent) throw new NotFoundException('Danışman bulunamadı.');
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    try {
      const agent = await this.agentModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .lean({ virtuals: true });
      if (!agent) throw new NotFoundException('Danışman bulunamadı.');
      return agent;
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const inUse = await this.transactionModel.countDocuments({
      $or: [{ listingAgent: id }, { sellingAgent: id }],
    });
    if (inUse > 0) {
      throw new BadRequestException(
        'Bu danışman bir veya daha fazla işlemde atanmış; silmek için önce ilgili işlemleri kaldırın veya danışman atamalarını değiştirin.',
      );
    }
    const deleted = await this.agentModel.findByIdAndDelete(id).lean({ virtuals: true });
    if (!deleted) throw new NotFoundException('Danışman bulunamadı.');
    return { success: true, id };
  }

  private isDuplicateEmailError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}

