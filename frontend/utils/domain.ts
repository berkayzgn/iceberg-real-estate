export type Stage = 'agreement' | 'earnest_money' | 'title_deed' | 'completed';
export type PropertyType = 'sale' | 'rental';

export interface Agent {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  title: string;
  email: string;
  phone: string;
  joinDate: string;
  specialization: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: 'stage_change' | 'financial';
  fromStage?: Stage;
  toStage?: Stage;
  note?: string | null;
  financialReasonKey?: string;
}

export interface Transaction {
  id: string;
  propertyAddress: string;
  propertyType: PropertyType;
  transactionValue: number;
  stage: Stage;
  listingAgentId: string;
  sellingAgentId: string;
  date: string;
  completedAt?: string;
  activityLog: ActivityEntry[];
}

export interface MonthlyData {
  month: string;
  agencyShare: number;
  agentShare: number;
}

export const STAGE_ORDER: Stage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];

export const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  agreement: { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  earnest_money: { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },
  title_deed: { bg: '#EDE9FE', text: '#6D28D9', dot: '#8B5CF6' },
  completed: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
};

export function getNextStage(stage: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function calculateCommission(transaction: Transaction) {
  const total = transaction.transactionValue;
  const company = total * 0.5;
  const agentTotal = total * 0.5;
  const isSameAgent = transaction.listingAgentId === transaction.sellingAgentId;
  return {
    total,
    company,
    agentTotal,
    listingAgent: isSameAgent ? agentTotal : agentTotal * 0.5,
    sellingAgent: isSameAgent ? 0 : agentTotal * 0.5,
    isSameAgent,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getAgentStats(agentId: string, transactions: Transaction[]) {
  const agentTxns = transactions.filter(
    t => t.listingAgentId === agentId || t.sellingAgentId === agentId
  );
  const completedTxns = agentTxns.filter(t => t.stage === 'completed');
  let totalEarnings = 0;
  completedTxns.forEach(t => {
    const comm = calculateCommission(t);
    if (t.listingAgentId === agentId) totalEarnings += comm.listingAgent;
    if (t.sellingAgentId === agentId && !comm.isSameAgent) totalEarnings += comm.sellingAgent;
  });
  const listingCount = transactions.filter(t => t.listingAgentId === agentId).length;
  const sellingCount = transactions.filter(t => t.sellingAgentId === agentId && t.sellingAgentId !== t.listingAgentId).length;
  return { totalTransactions: agentTxns.length, totalEarnings, completedTransactions: completedTxns.length, listingCount, sellingCount };
}
