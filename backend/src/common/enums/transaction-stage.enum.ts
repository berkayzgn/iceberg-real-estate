/** Transaction lifecycle stages; allowed moves in `VALID_TRANSITIONS`. */
export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

export const VALID_TRANSITIONS: Record<
  TransactionStage,
  TransactionStage[]
> = {
  [TransactionStage.AGREEMENT]: [TransactionStage.EARNEST_MONEY],
  [TransactionStage.EARNEST_MONEY]: [TransactionStage.TITLE_DEED],
  [TransactionStage.TITLE_DEED]: [TransactionStage.COMPLETED],
  [TransactionStage.COMPLETED]: [],
};
