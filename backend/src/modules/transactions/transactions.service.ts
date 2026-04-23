import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TransactionStage,
  VALID_TRANSITIONS,
} from '../../common/enums/transaction-stage.enum';
import { Agent, AgentDocument } from '../agents/schemas/agent.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import {
  CommissionBreakdown,
  Transaction,
  TransactionDocument,
} from './schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async create(dto: CreateTransactionDto) {
    await this.assertAgentsExist(dto.listingAgent, dto.sellingAgent);

    const now = new Date();
    const created = await this.transactionModel.create({
      ...dto,
      stage: TransactionStage.AGREEMENT,
      stageHistory: [
        {
          fromStage: TransactionStage.AGREEMENT,
          toStage: TransactionStage.AGREEMENT,
          changedAt: now,
          note: 'Transaction created.',
        },
      ],
    });

    return this.findOne(String(created._id));
  }

  async findAll() {
    return this.transactionModel
      .find()
      .sort({ createdAt: -1 })
      .populate('listingAgent')
      .populate('sellingAgent')
      .lean();
  }

  async findOne(id: string) {
    const txn = await this.transactionModel
      .findById(id)
      .populate('listingAgent')
      .populate('sellingAgent')
      .lean();
    if (!txn) throw new NotFoundException('İşlem bulunamadı.');
    return txn;
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    const txn = await this.transactionModel.findById(id);
    if (!txn) throw new NotFoundException('İşlem bulunamadı.');

    const current = txn.stage;
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(dto.stage)) {
      throw new BadRequestException(
        `Geçersiz aşama geçişi: ${current} -> ${dto.stage}`,
      );
    }

    txn.stageHistory.push({
      fromStage: current,
      toStage: dto.stage,
      changedAt: new Date(),
      note: dto.note ?? 'Stage updated.',
    });
    txn.stage = dto.stage;

    if (dto.stage === TransactionStage.COMPLETED) {
      txn.completedAt = new Date();
      txn.commissionBreakdown = this.calculateCommissionBreakdown(txn);
    }

    await txn.save();
    return this.findOne(id);
  }

  async getBreakdown(id: string) {
    const txn = await this.transactionModel.findById(id).lean();
    if (!txn) throw new NotFoundException('İşlem bulunamadı.');
    if (!txn.commissionBreakdown) {
      throw new BadRequestException(
        'Bu işlem henüz tamamlanmadı; finansal döküm hazır değil.',
      );
    }
    return txn.commissionBreakdown;
  }

  async remove(id: string) {
    const deleted = await this.transactionModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('İşlem bulunamadı.');
    return { success: true, id };
  }

  private calculateCommissionBreakdown(
    txn: Pick<Transaction, 'transactionValue' | 'listingAgent' | 'sellingAgent'>,
  ): CommissionBreakdown {
    const total = txn.transactionValue;
    const agencyShare = total * 0.5;
    const agentTotal = total * 0.5;
    const sameAgent = String(txn.listingAgent) === String(txn.sellingAgent);

    if (sameAgent) {
      return {
        agencyShare,
        agentTotal,
        listingAgentShare: agentTotal,
        sellingAgentShare: 0,
        sameAgent: true,
        reason:
          'Listing ve selling agent aynı kişi olduğu için agent payının tamamı tek ajana verildi.',
      };
    }

    return {
      agencyShare,
      agentTotal,
      listingAgentShare: agentTotal * 0.5,
      sellingAgentShare: agentTotal * 0.5,
      sameAgent: false,
      reason:
        'Listing ve selling agent farklı olduğu için agent payı eşit bölündü.',
    };
  }

  private async assertAgentsExist(listingAgent: string, sellingAgent: string) {
    const [listing, selling] = await Promise.all([
      this.agentModel.exists({ _id: listingAgent }),
      this.agentModel.exists({ _id: sellingAgent }),
    ]);
    if (!listing) throw new BadRequestException('İlan danışmanı bulunamadı.');
    if (!selling) throw new BadRequestException('Satış danışmanı bulunamadı.');
  }
}

