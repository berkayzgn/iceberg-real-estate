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
  type: 'stage_change' | 'note' | 'financial';
  description: string;
  fromStage?: Stage;
  toStage?: Stage;
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
  activityLog: ActivityEntry[];
}

export interface MonthlyData {
  month: string;
  agencyShare: number;
  agentShare: number;
}

/** Aşama etiketleri (rehberdeki süreç; arayüz TR). */
export const STAGE_LABELS: Record<Stage, string> = {
  agreement: 'Anlaşma',
  earnest_money: 'Kapora',
  title_deed: 'Tapu',
  completed: 'Tamamlandı',
};

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

/** Rehber: tutarlar TL — para birimi TL gösterilir. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export function getAgentStats(agentId: string, transactions: Transaction[]) {
  const agentTxns = transactions.filter(
    t => t.listingAgentId === agentId || t.sellingAgentId === agentId
  );
  let totalEarnings = 0;
  agentTxns.forEach(t => {
    const comm = calculateCommission(t);
    if (t.listingAgentId === agentId) totalEarnings += comm.listingAgent;
    if (t.sellingAgentId === agentId && !comm.isSameAgent) totalEarnings += comm.sellingAgent;
  });
  const completedTxns = agentTxns.filter(t => t.stage === 'completed');
  const listingCount = transactions.filter(t => t.listingAgentId === agentId).length;
  const sellingCount = transactions.filter(t => t.sellingAgentId === agentId && t.sellingAgentId !== t.listingAgentId).length;
  return { totalTransactions: agentTxns.length, totalEarnings, completedTransactions: completedTxns.length, listingCount, sellingCount };
}
