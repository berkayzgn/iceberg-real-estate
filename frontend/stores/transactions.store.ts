import { defineStore } from 'pinia';
import type { Stage, Transaction } from '~/utils/demo-data';
import { getNextStage, TRANSACTIONS } from '~/utils/demo-data';

function cloneTransactions(seed: Transaction[]): Transaction[] {
  // demo state should be mutable without touching module constants
  return seed.map((t) => ({
    ...t,
    activityLog: t.activityLog.map((a) => ({ ...a })),
  }));
}

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>(cloneTransactions(TRANSACTIONS));

  function findById(id: string) {
    return transactions.value.find((t) => t.id === id);
  }

  function addTransaction(input: Omit<Transaction, 'activityLog'> & { activityLog?: Transaction['activityLog'] }) {
    const now = new Date().toISOString();
    const activityLog =
      input.activityLog ??
      [
        {
          id: `al-${input.id}-1`,
          timestamp: now,
          type: 'stage_change' as const,
          description: 'Agreement signed. Transaction created.',
          toStage: input.stage,
        },
      ];

    transactions.value.unshift({
      ...input,
      activityLog,
    });
  }

  function advanceStage(id: string) {
    const t = findById(id);
    if (!t) return;
    const next = getNextStage(t.stage);
    if (!next) return;

    const now = new Date().toISOString();
    const from = t.stage;
    t.stage = next;
    t.activityLog.push({
      id: `al-${t.id}-${t.activityLog.length + 1}`,
      timestamp: now,
      type: 'stage_change',
      description:
        next === 'completed'
          ? 'Transaction completed. Commission disbursed.'
          : 'Stage advanced.',
      fromStage: from,
      toStage: next,
    });
  }

  function setStage(id: string, stage: Stage) {
    const t = findById(id);
    if (!t) return;
    t.stage = stage;
  }

  return {
    transactions,
    findById,
    addTransaction,
    advanceStage,
    setStage,
  };
});

