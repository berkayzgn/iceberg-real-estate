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

/** Rehber: tutarlar TL — demo veride rakamlar aynı, para birimi TL gösterilir. */
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

export const AGENTS: Agent[] = [
  {
    id: 'a1',
    name: 'Sarah Mitchell',
    initials: 'SM',
    avatarColor: '#3B82F6',
    title: 'Senior Estate Agent',
    email: 'sarah.mitchell@propex.co',
    phone: '+44 7891 234 567',
    joinDate: '15 Jan 2022',
    specialization: 'Luxury Residential',
  },
  {
    id: 'a2',
    name: 'James Chen',
    initials: 'JC',
    avatarColor: '#8B5CF6',
    title: 'Senior Estate Agent',
    email: 'james.chen@propex.co',
    phone: '+44 7892 345 678',
    joinDate: '03 Mar 2021',
    specialization: 'Commercial & Retail',
  },
  {
    id: 'a3',
    name: 'Elena Rodriguez',
    initials: 'ER',
    avatarColor: '#EC4899',
    title: 'Estate Agent',
    email: 'elena.rodriguez@propex.co',
    phone: '+44 7893 456 789',
    joinDate: '22 Jul 2023',
    specialization: 'New Developments',
  },
  {
    id: 'a4',
    name: 'Marcus Thompson',
    initials: 'MT',
    avatarColor: '#10B981',
    title: 'Estate Agent',
    email: 'marcus.thompson@propex.co',
    phone: '+44 7894 567 890',
    joinDate: '10 Sep 2023',
    specialization: 'Suburban Residential',
  },
  {
    id: 'a5',
    name: 'Priya Patel',
    initials: 'PP',
    avatarColor: '#F59E0B',
    title: 'Rental Specialist',
    email: 'priya.patel@propex.co',
    phone: '+44 7895 678 901',
    joinDate: '01 Feb 2022',
    specialization: 'Luxury Rentals',
  },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    propertyAddress: '42 Harrington Gardens, London SW7 4JU',
    propertyType: 'sale',
    transactionValue: 52500,
    stage: 'agreement',
    listingAgentId: 'a1',
    sellingAgentId: 'a1',
    date: '2026-04-10',
    activityLog: [
      { id: 'al1', timestamp: '2026-04-10T09:30:00', type: 'stage_change', description: 'Agreement signed. Transaction created.', toStage: 'agreement' },
    ],
  },
  {
    id: 'T002',
    propertyAddress: 'Penthouse 8A, Belgravia Court, London SW1X',
    propertyType: 'sale',
    transactionValue: 85000,
    stage: 'earnest_money',
    listingAgentId: 'a2',
    sellingAgentId: 'a3',
    date: '2026-03-28',
    activityLog: [
      { id: 'al1', timestamp: '2026-03-28T10:00:00', type: 'stage_change', description: 'Agreement signed. Transaction created.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-04-02T14:15:00', type: 'stage_change', description: 'Earnest money received. Stage advanced.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-04-02T14:16:00', type: 'financial', description: 'Earnest money deposit confirmed: €12,750.' },
    ],
  },
  {
    id: 'T003',
    propertyAddress: '17 Elm Grove, Manchester M21 9JN',
    propertyType: 'sale',
    transactionValue: 28000,
    stage: 'title_deed',
    listingAgentId: 'a4',
    sellingAgentId: 'a4',
    date: '2026-03-15',
    activityLog: [
      { id: 'al1', timestamp: '2026-03-15T09:00:00', type: 'stage_change', description: 'Agreement signed. Transaction created.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-03-22T11:30:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-04-05T16:00:00', type: 'stage_change', description: 'Title deed process initiated.', fromStage: 'earnest_money', toStage: 'title_deed' },
    ],
  },
  {
    id: 'T004',
    propertyAddress: 'Marina Suite 604, Canary Wharf, London E14',
    propertyType: 'rental',
    transactionValue: 12000,
    stage: 'completed',
    listingAgentId: 'a5',
    sellingAgentId: 'a2',
    date: '2026-02-14',
    activityLog: [
      { id: 'al1', timestamp: '2026-02-14T10:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-02-18T14:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-02-25T11:00:00', type: 'stage_change', description: 'Title deed prepared.', fromStage: 'earnest_money', toStage: 'title_deed' },
      { id: 'al4', timestamp: '2026-03-05T15:30:00', type: 'stage_change', description: 'Transaction completed. Commission disbursed.', fromStage: 'title_deed', toStage: 'completed' },
      { id: 'al5', timestamp: '2026-03-05T15:31:00', type: 'financial', description: 'Commission split: Agency €6,000 | Agents €6,000.' },
    ],
  },
  {
    id: 'T005',
    propertyAddress: '8 Kensington Palace Gardens, London W8',
    propertyType: 'sale',
    transactionValue: 120000,
    stage: 'earnest_money',
    listingAgentId: 'a1',
    sellingAgentId: 'a2',
    date: '2026-04-01',
    activityLog: [
      { id: 'al1', timestamp: '2026-04-01T09:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-04-08T12:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
    ],
  },
  {
    id: 'T006',
    propertyAddress: 'Unit 22, The Ivy Residence, Bristol BS1',
    propertyType: 'rental',
    transactionValue: 18500,
    stage: 'agreement',
    listingAgentId: 'a3',
    sellingAgentId: 'a3',
    date: '2026-04-12',
    activityLog: [
      { id: 'al1', timestamp: '2026-04-12T11:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
    ],
  },
  {
    id: 'T007',
    propertyAddress: '55 Montagu Square, London W1H 2LF',
    propertyType: 'sale',
    transactionValue: 64000,
    stage: 'completed',
    listingAgentId: 'a2',
    sellingAgentId: 'a2',
    date: '2026-01-20',
    activityLog: [
      { id: 'al1', timestamp: '2026-01-20T09:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-01-28T14:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-02-10T11:00:00', type: 'stage_change', description: 'Title deed process initiated.', fromStage: 'earnest_money', toStage: 'title_deed' },
      { id: 'al4', timestamp: '2026-02-28T16:00:00', type: 'stage_change', description: 'Transaction completed.', fromStage: 'title_deed', toStage: 'completed' },
      { id: 'al5', timestamp: '2026-02-28T16:01:00', type: 'financial', description: 'Full commission disbursed: Agency €32,000 | Agent €32,000.' },
    ],
  },
  {
    id: 'T008',
    propertyAddress: 'Apt 11B, Chelsea Cloisters, London SW3',
    propertyType: 'rental',
    transactionValue: 15000,
    stage: 'title_deed',
    listingAgentId: 'a5',
    sellingAgentId: 'a4',
    date: '2026-03-20',
    activityLog: [
      { id: 'al1', timestamp: '2026-03-20T10:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-03-26T14:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-04-04T09:00:00', type: 'stage_change', description: 'Title deed process started.', fromStage: 'earnest_money', toStage: 'title_deed' },
    ],
  },
  {
    id: 'T009',
    propertyAddress: 'The Old Mill House, Windsor, Berkshire SL4',
    propertyType: 'sale',
    transactionValue: 42000,
    stage: 'agreement',
    listingAgentId: 'a4',
    sellingAgentId: 'a3',
    date: '2026-04-09',
    activityLog: [
      { id: 'al1', timestamp: '2026-04-09T10:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
    ],
  },
  {
    id: 'T010',
    propertyAddress: '3 Grosvenor Crescent Mews, London SW1X',
    propertyType: 'sale',
    transactionValue: 76500,
    stage: 'completed',
    listingAgentId: 'a1',
    sellingAgentId: 'a4',
    date: '2026-02-05',
    activityLog: [
      { id: 'al1', timestamp: '2026-02-05T09:30:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-02-12T13:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-02-22T10:00:00', type: 'stage_change', description: 'Title deed process initiated.', fromStage: 'earnest_money', toStage: 'title_deed' },
      { id: 'al4', timestamp: '2026-03-10T14:30:00', type: 'stage_change', description: 'Transaction completed.', fromStage: 'title_deed', toStage: 'completed' },
      { id: 'al5', timestamp: '2026-03-10T14:31:00', type: 'financial', description: 'Commission disbursed: Agency €38,250 | Agents €38,250.' },
    ],
  },
  {
    id: 'T011',
    propertyAddress: 'Suite 501, One Canada Square, London E14',
    propertyType: 'rental',
    transactionValue: 22000,
    stage: 'earnest_money',
    listingAgentId: 'a3',
    sellingAgentId: 'a5',
    date: '2026-03-30',
    activityLog: [
      { id: 'al1', timestamp: '2026-03-30T10:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-04-07T15:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
    ],
  },
  {
    id: 'T012',
    propertyAddress: '12 Ladbroke Grove, Notting Hill, London W11',
    propertyType: 'sale',
    transactionValue: 35000,
    stage: 'completed',
    listingAgentId: 'a2',
    sellingAgentId: 'a3',
    date: '2026-01-08',
    activityLog: [
      { id: 'al1', timestamp: '2026-01-08T09:00:00', type: 'stage_change', description: 'Agreement signed.', toStage: 'agreement' },
      { id: 'al2', timestamp: '2026-01-15T11:00:00', type: 'stage_change', description: 'Earnest money received.', fromStage: 'agreement', toStage: 'earnest_money' },
      { id: 'al3', timestamp: '2026-01-25T14:00:00', type: 'stage_change', description: 'Title deed process initiated.', fromStage: 'earnest_money', toStage: 'title_deed' },
      { id: 'al4', timestamp: '2026-02-08T16:00:00', type: 'stage_change', description: 'Transaction completed.', fromStage: 'title_deed', toStage: 'completed' },
      { id: 'al5', timestamp: '2026-02-08T16:01:00', type: 'financial', description: 'Commission split: Agency €17,500 | Agents €17,500.' },
    ],
  },
];

export const MONTHLY_DATA: MonthlyData[] = [
  { month: 'Jul', agencyShare: 28500, agentShare: 28500 },
  { month: 'Aug', agencyShare: 34000, agentShare: 34000 },
  { month: 'Sep', agencyShare: 22000, agentShare: 22000 },
  { month: 'Oct', agencyShare: 45000, agentShare: 45000 },
  { month: 'Nov', agencyShare: 38500, agentShare: 38500 },
  { month: 'Dec', agencyShare: 52000, agentShare: 52000 },
  { month: 'Jan', agencyShare: 49500, agentShare: 49500 },
  { month: 'Feb', agencyShare: 67500, agentShare: 67500 },
  { month: 'Mar', agencyShare: 55000, agentShare: 55000 },
  { month: 'Apr', agencyShare: 43750, agentShare: 43750 },
];

export const SPARKLINE_DATA = {
  transactions: [4, 6, 5, 8, 7, 9, 8, 10, 9, 12],
  active: [3, 4, 3, 5, 6, 5, 7, 6, 8, 8],
  revenue: [62000, 85000, 72000, 95000, 88000, 105000, 98000, 135000, 110000, 187500],
  pending: [42000, 55000, 48000, 62000, 58000, 70000, 65000, 78000, 72000, 93750],
};

/** Raporlar bar grafiği — çeyrek (React `FinancialReportsPage` ile aynı rakamlar). */
export const QUARTERLY_DATA: MonthlyData[] = [
  { month: 'Q3 2025', agencyShare: 84500, agentShare: 84500 },
  { month: 'Q4 2025', agencyShare: 135500, agentShare: 135500 },
  { month: 'Q1 2026', agencyShare: 172000, agentShare: 172000 },
  { month: 'Q2 2026', agencyShare: 43750, agentShare: 43750 },
];

export const YEARLY_DATA: MonthlyData[] = [
  { month: '2023', agencyShare: 245000, agentShare: 245000 },
  { month: '2024', agencyShare: 380000, agentShare: 380000 },
  { month: '2025', agencyShare: 435750, agentShare: 435750 },
];

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
