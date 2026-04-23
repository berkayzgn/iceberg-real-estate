import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';

export class UpdateStageDto {
  @IsEnum(TransactionStage)
  stage!: TransactionStage;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

