import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Plus, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { StageBadge } from '../components/StageBadge';
import { CreateTransactionModal } from '../components/CreateTransactionModal';
import {
  STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, SPARKLINE_DATA,
  calculateCommission, formatCurrency, timeAgo, Transaction
} from '../data/mockData';

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function MetricCard({ label, value, displayValue, trend, sparkData, color }: {
  label: string;
  value: number;
  displayValue: string;
  trend: number;
  sparkData: number[];
  color: string;
}) {
  const animated = useCountUp(value);
  const isPositive = trend > 0;
  const data = sparkData.map((v, i) => ({ v }));
  const gradId = `grad-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[#64748B] font-medium">{label}</p>
        <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-[#0A1628] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {displayValue.includes('€') ? `€${animated.toLocaleString()}` : animated}
      </div>
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} fill={`url(#${gradId})`} dot={false} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TransactionCard({ transaction, onClick }: { transaction: Transaction; onClick: () => void }) {
  const { getAgent } = useApp();
  const listingAgent = getAgent(transaction.listingAgentId);
  const comm = calculateCommission(transaction);
  const isSame = transaction.listingAgentId === transaction.sellingAgentId;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-[#0A1628] leading-snug pr-2 line-clamp-2">
          {transaction.propertyAddress.split(',')[0]}
        </p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${transaction.propertyType === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
          {transaction.propertyType}
        </span>
      </div>
      <p className="text-[#64748B] text-xs mb-3 truncate">{transaction.propertyAddress.split(',').slice(1).join(',').trim()}</p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[#0A1628]">{formatCurrency(transaction.transactionValue)}</span>
        <StageBadge stage={transaction.stage} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        {listingAgent && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: listingAgent.avatarColor }}
            >
              {listingAgent.initials}
            </div>
            {!isSame && (() => {
              const sa = getAgent(transaction.sellingAgentId);
              return sa ? (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold -ml-2 ring-2 ring-white" style={{ backgroundColor: sa.avatarColor }}>
                  {sa.initials}
                </div>
              ) : null;
            })()}
          </div>
        )}
        <span className="text-xs text-[#D4A853] font-semibold">{formatCurrency(comm.agentTotal)}</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { transactions } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const completed = transactions.filter(t => t.stage === 'completed');
  const active = transactions.filter(t => t.stage !== 'completed');
  const totalRevenue = completed.reduce((s, t) => s + t.transactionValue, 0);
  const pendingCommissions = active.reduce((s, t) => s + calculateCommission(t).agentTotal, 0);

  const metrics = [
    { label: 'Total Transactions', value: transactions.length, displayValue: String(transactions.length), trend: 12, sparkData: SPARKLINE_DATA.transactions, color: '#3B82F6' },
    { label: 'Active Transactions', value: active.length, displayValue: String(active.length), trend: 8, sparkData: SPARKLINE_DATA.active, color: '#D4A853' },
    { label: 'Total Revenue', value: totalRevenue, displayValue: `€${totalRevenue.toLocaleString()}`, trend: 24, sparkData: SPARKLINE_DATA.revenue, color: '#10B981' },
    { label: 'Pending Commissions', value: pendingCommissions, displayValue: `€${pendingCommissions.toLocaleString()}`, trend: -5, sparkData: SPARKLINE_DATA.pending, color: '#8B5CF6' },
  ];

  // Recent activity from all transactions
  const recentActivity = transactions
    .flatMap(t => t.activityLog.map(a => ({ ...a, transactionId: t.id, address: t.propertyAddress.split(',')[0] })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0A1628]">Dashboard</h1>
          <p className="text-[#64748B] text-sm mt-0.5">Overview of all active transactions and performance</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-amber-200"
          style={{ backgroundColor: '#D4A853' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Transaction</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Pipeline Kanban */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#0A1628]">Transaction Pipeline</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#D4A853] transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGE_ORDER.map(stage => {
              const stageTxns = transactions.filter(t => t.stage === stage);
              const colors = STAGE_COLORS[stage];
              return (
                <div key={stage} className="flex-shrink-0 w-[260px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                    <span className="text-sm font-semibold text-[#0A1628]">{STAGE_LABELS[stage]}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {stageTxns.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stageTxns.length === 0 ? (
                      <div className="bg-white rounded-xl p-4 border border-dashed border-[#E2E8F0] text-center text-sm text-[#94A3B8]">
                        No transactions
                      </div>
                    ) : (
                      stageTxns.map(t => (
                        <TransactionCard
                          key={t.id}
                          transaction={t}
                          onClick={() => navigate(`/transactions/${t.id}`)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="w-full xl:w-72 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#64748B]" />
            <h2 className="text-[#0A1628]">Recent Activity</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
              {recentActivity.map((activity, idx) => (
                <div
                  key={`${activity.id}-${idx}`}
                  className="flex gap-3 p-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer"
                  onClick={() => navigate(`/transactions/${activity.transactionId}`)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.type === 'stage_change' ? (
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0A1628] truncate">{activity.address}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{activity.description}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateTransactionModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}