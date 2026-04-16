import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, TrendingUp, Award, ArrowRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { AgentAvatar, AgentChip } from '../components/AgentChip';
import { StageBadge } from '../components/StageBadge';
import { formatDateForLocale } from '../../i18n/formatDate';
import { formatCurrency, getAgentStats, calculateCommission } from '../data/mockData';

const PIE_ROLE_KEYS = {
  listing: 'agents.roleListing',
  selling: 'agents.roleSelling',
  dual: 'agents.roleDual',
} as const;

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
const BASE_EARNINGS: Record<string, number[]> = {
  a1: [8500, 11200, 7400, 14500, 12000, 16800, 15200, 22000, 17500, 9500],
  a2: [12000, 9800, 15200, 18400, 11500, 21000, 18700, 26500, 19800, 13200],
  a3: [5200, 7800, 9500, 8200, 14500, 12400, 11800, 15600, 13200, 8500],
  a4: [3500, 5200, 4800, 7500, 8200, 9500, 8800, 12500, 10200, 6500],
  a5: [9800, 12500, 8700, 15200, 10500, 18400, 14500, 20800, 16200, 10200],
};

function AgentCard({ agentId, onClick }: { agentId: string; onClick: () => void }) {
  const { t } = useTranslation();
  const { getAgent, transactions } = useApp();
  const agent = getAgent(agentId);
  if (!agent) return null;
  const stats = getAgentStats(agentId, transactions);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <AgentAvatar agent={agent} size="lg" />
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#F1F5F9] text-[#64748B] group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
          {agent.specialization}
        </span>
      </div>
      <h3 className="text-[#0A1628] mb-0.5">{agent.name}</h3>
      <p className="text-sm text-[#64748B] mb-4">{agent.title}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#FAFBFC] border border-[#E2E8F0]">
          <p className="text-xs text-[#64748B] mb-1">{t('agents.transactions')}</p>
          <p className="text-lg font-bold text-[#0A1628]">{stats.totalTransactions}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#FAFBFC] border border-[#E2E8F0]">
          <p className="text-xs text-[#64748B] mb-1">{t('agents.totalEarned')}</p>
          <p className="text-lg font-bold text-[#D4A853]">{formatCurrency(stats.totalEarnings)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-xs text-[#94A3B8]">{t('common.since', { date: agent.joinDate })}</span>
        <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#D4A853] transition-colors" />
      </div>
    </div>
  );
}

function AgentDetailView({ agentId, onBack }: { agentId: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { getAgent, transactions } = useApp();
  const navigate = useNavigate();
  const formatDate = (d: string) => formatDateForLocale(d, i18n.language);
  const agent = getAgent(agentId);
  if (!agent) return null;

  const stats = getAgentStats(agentId, transactions);
  const agentTxns = transactions.filter(
    t => t.listingAgentId === agentId || t.sellingAgentId === agentId
  );

  const earningsData = MONTHS.map((month, i) => ({
    month,
    earnings: (BASE_EARNINGS[agentId]?.[i] ?? 0),
  }));

  const listingCount = agentTxns.filter(t => t.listingAgentId === agentId).length;
  const sellingCount = agentTxns.filter(t => t.sellingAgentId === agentId && t.sellingAgentId !== t.listingAgentId).length;
  const dualCount = agentTxns.filter(t => t.listingAgentId === agentId && t.sellingAgentId === agentId).length;

  const roleData = [
    { key: 'listing' as const, name: t(PIE_ROLE_KEYS.listing), value: listingCount, color: '#0A1628' },
    { key: 'selling' as const, name: t(PIE_ROLE_KEYS.selling), value: sellingCount, color: '#D4A853' },
    { key: 'dual' as const, name: t(PIE_ROLE_KEYS.dual), value: dualCount, color: '#10B981' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0A1628] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        {t('agents.back')}
      </button>

      {/* Agent Profile */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
          <AgentAvatar agent={agent} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-[#0A1628]">{agent.name}</h2>
                <p className="text-sm text-[#64748B]">{agent.title}</p>
                <span className="inline-block mt-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                  {agent.specialization}
                </span>
              </div>
              <div className="flex gap-3">
                <a href={`mailto:${agent.email}`} className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors" aria-label="Email">
                  <Mail className="w-4 h-4" />
                </a>
                <a href={`tel:${agent.phone}`} className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors" aria-label="Call">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="flex gap-4 mt-4 flex-wrap text-sm text-[#64748B]">
              <span>{agent.email}</span>
              <span>{agent.phone}</span>
              <span>{t('common.joined', { date: agent.joinDate })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#F1F5F9] pt-5">
          {[
            { labelKey: 'agents.statsTotalTransactions' as const, value: stats.totalTransactions, color: '#0A1628' },
            { labelKey: 'agents.statsCompleted' as const, value: stats.completedTransactions, color: '#10B981' },
            { labelKey: 'agents.statsTotalEarned' as const, value: formatCurrency(stats.totalEarnings), color: '#D4A853' },
            { labelKey: 'agents.statsDualAgent' as const, value: dualCount, color: '#8B5CF6' },
          ].map(item => (
            <div key={item.labelKey} className="text-center p-3 rounded-xl bg-[#FAFBFC] border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-1">{t(item.labelKey)}</p>
              <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#D4A853]" />
            <h3 className="text-[#0A1628]">{t('agents.chartTitle')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={earningsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), t('agents.chartTooltipEarnings')]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="earnings" stroke="#D4A853" strokeWidth={2} dot={{ fill: '#D4A853', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-[#D4A853]" />
            <h3 className="text-[#0A1628]">{t('agents.roleDistribution')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" outerRadius={55} innerRadius={35} paddingAngle={3} dataKey="value">
                {roleData.map((entry, i) => <Cell key={entry.key} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: number) => [v, t('agents.roleTooltipTransactions')]} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleData.map(item => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#64748B]">{t(PIE_ROLE_KEYS[item.key])}</span>
                </div>
                <span className="font-semibold text-[#0A1628]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
        <h3 className="text-[#0A1628] mb-4">{t('agents.transactionHistory')}</h3>
        {agentTxns.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-8">{t('agents.noTransactionsYet')}</p>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {agentTxns.map(t => {
              const isListing = t.listingAgentId === agentId;
              const isDual = t.listingAgentId === agentId && t.sellingAgentId === agentId;
              const comm = calculateCommission(t);
              const agentEarnings = isDual ? comm.listingAgent : isListing ? comm.listingAgent : comm.sellingAgent;
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/transactions/${t.id}`)}
                  className="flex items-center justify-between py-3 hover:bg-[#FAFBFC] -mx-2 px-2 rounded-lg cursor-pointer transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628]">{t.propertyAddress.split(',')[0]}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#94A3B8]">{formatDate(t.date)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isDual ? 'bg-purple-50 text-purple-600' : isListing ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'}`}>
                        {isDual ? t('agents.historyBadgeDual') : isListing ? t('agents.historyBadgeListing') : t('agents.historyBadgeSelling')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StageBadge stage={t.stage} size="sm" />
                    <span className="text-sm font-bold text-[#D4A853]">{formatCurrency(agentEarnings)}</span>
                    <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#D4A853] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentsPage() {
  const { t } = useTranslation();
  const { agents } = useApp();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  if (selectedAgentId) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <AgentDetailView agentId={selectedAgentId} onBack={() => setSelectedAgentId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[#0A1628]">{t('agents.title')}</h1>
        <p className="text-[#64748B] text-sm mt-0.5">{t('agents.subtitle', { count: agents.length })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {agents.map(agent => (
          <AgentCard key={agent.id} agentId={agent.id} onClick={() => setSelectedAgentId(agent.id)} />
        ))}
      </div>
    </div>
  );
}