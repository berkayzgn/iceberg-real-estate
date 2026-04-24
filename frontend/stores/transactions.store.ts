import { defineStore } from 'pinia';
import { authorizedFetch } from '~/utils/authorized-fetch';
import { normalizeCommissionReasonKey } from '~/utils/commission-reason';
import type { Stage, Transaction } from '~/utils/domain';
import { getNextStage, type ActivityEntry } from '~/utils/domain';

type ApiAgentRef = string | { _id: string };
type ApiStageHistory = {
  fromStage: Stage;
  toStage: Stage;
  changedAt: string;
  note?: string;
};
type ApiBreakdown = {
  agencyShare: number;
  agentTotal: number;
  listingAgentShare: number;
  sellingAgentShare: number;
  sameAgent: boolean;
  reason: string;
};
type ApiTransaction = {
  _id: string;
  propertyAddress: string;
  propertyType: 'sale' | 'rental';
  transactionValue: number;
  stage: Stage;
  listingAgent: ApiAgentRef;
  sellingAgent: ApiAgentRef;
  stageHistory?: ApiStageHistory[];
  commissionBreakdown?: ApiBreakdown;
  completedAt?: string;
  createdAt?: string;
};

function mapAgentId(input: ApiAgentRef) {
  if (typeof input === 'string') return input;
  return String(input?._id ?? '');
}

function mapActivityLog(tx: ApiTransaction): ActivityEntry[] {
  const stageEntries =
    tx.stageHistory?.map((entry, index) => ({
      id: `al-${tx._id}-${index + 1}`,
      timestamp: entry.changedAt,
      type: 'stage_change' as const,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      note: entry.note ?? undefined,
    })) ?? [];

  if (tx.commissionBreakdown) {
    stageEntries.push({
      id: `al-${tx._id}-financial`,
      timestamp: tx.completedAt ?? tx.createdAt ?? new Date().toISOString(),
      type: 'financial',
      financialReasonKey: normalizeCommissionReasonKey(tx.commissionBreakdown.reason),
    });
  }

  return stageEntries.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function mapTransaction(tx: ApiTransaction): Transaction {
  return {
    id: String(tx._id),
    propertyAddress: tx.propertyAddress,
    propertyType: tx.propertyType,
    transactionValue: tx.transactionValue,
    stage: tx.stage,
    listingAgentId: mapAgentId(tx.listingAgent),
    sellingAgentId: mapAgentId(tx.sellingAgent),
    date: (tx.createdAt ?? new Date().toISOString()).slice(0, 10),
    completedAt: tx.completedAt,
    activityLog: mapActivityLog(tx),
  };
}

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  const apiBase = () => useRuntimeConfig().public.apiBase;

  function findById(id: string) {
    return transactions.value.find((t) => t.id === id);
  }

  function upsertTransaction(mapped: Transaction) {
    const idx = transactions.value.findIndex((t) => t.id === mapped.id);
    if (idx === -1) {
      transactions.value.unshift(mapped);
      return mapped;
    }
    transactions.value[idx] = mapped;
    return mapped;
  }

  async function fetchAll(force = false) {
    if (loading.value) return;
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const list = await authorizedFetch<ApiTransaction[]>(`${apiBase()}/transactions`);
      transactions.value = list.map(mapTransaction);
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id: string) {
    const tx = await authorizedFetch<ApiTransaction>(`${apiBase()}/transactions/${id}`);
    return upsertTransaction(mapTransaction(tx));
  }

  async function addTransaction(
    input: Omit<Transaction, 'id' | 'stage' | 'date' | 'activityLog'>,
  ) {
    const created = await authorizedFetch<ApiTransaction>(`${apiBase()}/transactions`, {
      method: 'POST',
      body: {
        propertyAddress: input.propertyAddress,
        propertyType: input.propertyType,
        transactionValue: input.transactionValue,
        listingAgent: input.listingAgentId,
        sellingAgent: input.sellingAgentId,
      },
    });
    loaded.value = true;
    return upsertTransaction(mapTransaction(created));
  }

  async function advanceStage(id: string) {
    const t = findById(id);
    if (!t) return null;
    const next = getNextStage(t.stage);
    if (!next) return null;
    const updated = await authorizedFetch<ApiTransaction>(`${apiBase()}/transactions/${id}/stage`, {
      method: 'PATCH',
      body: { stage: next },
    });
    return upsertTransaction(mapTransaction(updated));
  }

  async function setStage(id: string, stage: Stage) {
    const t = findById(id);
    if (!t) return null;
    if (t.stage === stage) return t;
    const updated = await authorizedFetch<ApiTransaction>(`${apiBase()}/transactions/${id}/stage`, {
      method: 'PATCH',
      body: { stage },
    });
    return upsertTransaction(mapTransaction(updated));
  }

  async function removeTransaction(id: string) {
    await authorizedFetch(`${apiBase()}/transactions/${id}`, { method: 'DELETE' });
    transactions.value = transactions.value.filter((t) => t.id !== id);
  }

  function clear() {
    transactions.value = [];
    loaded.value = false;
    loading.value = false;
  }

  return {
    transactions,
    loading,
    loaded,
    findById,
    fetchAll,
    fetchById,
    addTransaction,
    advanceStage,
    setStage,
    removeTransaction,
    clear,
  };
});
