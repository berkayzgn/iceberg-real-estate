import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

@Schema({
  timestamps: true,
  collection: 'agents',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Agent {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  specialization!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

AgentSchema.virtual('fullName').get(function (this: Agent) {
  return `${this.firstName} ${this.lastName}`.trim();
});

