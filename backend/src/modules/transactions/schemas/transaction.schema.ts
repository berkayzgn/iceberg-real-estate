import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';
import { Agent } from '../../agents/schemas/agent.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ _id: false })
export class CommissionBreakdown {
  @Prop({ required: true })
  agencyShare!: number;

  @Prop({ required: true })
  agentTotal!: number;

  @Prop({ required: true })
  listingAgentShare!: number;

  @Prop({ required: true })
  sellingAgentShare!: number;

  @Prop({ required: true })
  sameAgent!: boolean;

  @Prop({ required: true, trim: true })
  reason!: string;
}

export const CommissionBreakdownSchema =
  SchemaFactory.createForClass(CommissionBreakdown);

@Schema({ _id: false })
export class StageHistoryEntry {
  @Prop({ required: true, type: String, enum: TransactionStage })
  fromStage!: TransactionStage;

  @Prop({ required: true, type: String, enum: TransactionStage })
  toStage!: TransactionStage;

  @Prop({ required: true, default: Date.now })
  changedAt!: Date;

  @Prop({ trim: true })
  note?: string;
}

export const StageHistoryEntrySchema =
  SchemaFactory.createForClass(StageHistoryEntry);

@Schema({
  timestamps: true,
  collection: 'transactions',
})
export class Transaction {
  @Prop({ required: true, trim: true })
  propertyAddress!: string;

  @Prop({ required: true, enum: ['sale', 'rental'] })
  propertyType!: 'sale' | 'rental';

  @Prop({ required: true, min: 0 })
  transactionValue!: number;

  @Prop({
    required: true,
    type: String,
    enum: TransactionStage,
    default: TransactionStage.AGREEMENT,
  })
  stage!: TransactionStage;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Agent.name,
    required: true,
  })
  listingAgent!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Agent.name,
    required: true,
  })
  sellingAgent!: Types.ObjectId;

  @Prop({ type: [StageHistoryEntrySchema], default: [] })
  stageHistory!: StageHistoryEntry[];

  @Prop({ type: CommissionBreakdownSchema, required: false })
  commissionBreakdown?: CommissionBreakdown;

  @Prop({ type: Date, required: false })
  completedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

