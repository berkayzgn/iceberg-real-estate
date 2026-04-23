import { IsIn, IsMongoId, IsNumber, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  propertyAddress!: string;

  @IsIn(['sale', 'rental'])
  propertyType!: 'sale' | 'rental';

  @IsNumber()
  @IsPositive()
  transactionValue!: number;

  @IsMongoId()
  listingAgent!: string;

  @IsMongoId()
  sellingAgent!: string;
}

