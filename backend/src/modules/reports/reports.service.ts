import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';
import { Agent, AgentDocument } from '../agents/schemas/agent.schema';
import {
  CommissionBreakdown,
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async getSummary() {
    const completed = await this.transactionModel
      .find({ stage: TransactionStage.COMPLETED })
      .lean();

    const totals = completed.reduce(
      (acc, txn) => {
        const breakdown = this.resolveBreakdown(txn);
        acc.totalTransactions += 1;
        acc.totalServiceFee += txn.transactionValue;
        acc.totalAgencyShare += breakdown.agencyShare;
        acc.totalAgentPayout += breakdown.agentTotal;
        return acc;
      },
      {
        totalTransactions: 0,
        totalServiceFee: 0,
        totalAgencyShare: 0,
        totalAgentPayout: 0,
      },
    );

    return {
      ...totals,
      currency: 'USD',
      generatedAt: new Date().toISOString(),
    };
  }

  async getAgentReport(agentId: string) {
    const agent = await this.agentModel.findById(agentId).lean({ virtuals: true });
    if (!agent) throw new NotFoundException('Danışman bulunamadı.');

    const completed = await this.transactionModel
      .find({
        stage: TransactionStage.COMPLETED,
        $or: [{ listingAgent: agentId }, { sellingAgent: agentId }],
      })
      .lean();

    const report = completed.reduce(
      (acc, txn) => {
        const breakdown = this.resolveBreakdown(txn);
        const isSame = String(txn.listingAgent) === String(txn.sellingAgent);
        const isListing = String(txn.listingAgent) === agentId;
        const earning = isSame
          ? breakdown.listingAgentShare
          : isListing
            ? breakdown.listingAgentShare
            : breakdown.sellingAgentShare;

        acc.completedTransactions += 1;
        acc.totalEarnings += earning;
        if (isSame) acc.roles.dual += 1;
        else if (isListing) acc.roles.listing += 1;
        else acc.roles.selling += 1;

        acc.transactions.push({
          id: String(txn._id),
          propertyAddress: txn.propertyAddress,
          transactionValue: txn.transactionValue,
          completedAt: txn.completedAt,
          earning,
          role: isSame ? 'dual' : isListing ? 'listing' : 'selling',
        });

        return acc;
      },
      {
        completedTransactions: 0,
        totalEarnings: 0,
        roles: {
          listing: 0,
          selling: 0,
          dual: 0,
        },
        transactions: [] as Array<{
          id: string;
          propertyAddress: string;
          transactionValue: number;
          completedAt?: Date;
          earning: number;
          role: 'listing' | 'selling' | 'dual';
        }>,
      },
    );

    report.transactions.sort((a, b) => {
      const bt = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      const at = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      return bt - at;
    });

    return {
      agent: {
        id: String(agent._id),
        fullName: (agent as { fullName?: string }).fullName ??
          `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
      },
      ...report,
      currency: 'USD',
      generatedAt: new Date().toISOString(),
    };
  }

  private resolveBreakdown(
    txn: Pick<
      Transaction,
      'transactionValue' | 'listingAgent' | 'sellingAgent' | 'commissionBreakdown'
    >,
  ): CommissionBreakdown {
    if (txn.commissionBreakdown) return txn.commissionBreakdown;

    const total = txn.transactionValue;
    const agencyShare = total * 0.5;
    const agentTotal = total * 0.5;
    const sameAgent = String(txn.listingAgent) === String(txn.sellingAgent);
    return sameAgent
      ? {
          agencyShare,
          agentTotal,
          listingAgentShare: agentTotal,
          sellingAgentShare: 0,
          sameAgent: true,
          reason: 'Fallback calculation',
        }
      : {
          agencyShare,
          agentTotal,
          listingAgentShare: agentTotal * 0.5,
          sellingAgentShare: agentTotal * 0.5,
          sameAgent: false,
          reason: 'Fallback calculation',
        };
  }
}

