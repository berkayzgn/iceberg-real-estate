import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Download, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { StageBadge } from '../components/StageBadge';
import { AgentChip } from '../components/AgentChip';
import { formatDateForLocale } from '../../i18n/formatDate';
import { MONTHLY_DATA, calculateCommission, formatCurrency } from '../data/mockData';

type Period = 'monthly' | 'quarterly' | 'yearly';

const QUARTERLY_DATA = [
  { month: 'Q3 2025', agencyShare: 84500, agentShare: 84500 },
  { month: 'Q4 2025', agencyShare: 135500, agentShare: 135500 },
  { month: 'Q1 2026', agencyShare: 172000, agentShare: 172000 },
  { month: 'Q2 2026', agencyShare: 43750, agentShare: 43750 },
];

const YEARLY_DATA = [
  { month: '2023', agencyShare: 245000, agentShare: 245000 },
  { month: '2024', agencyShare: 380000, agentShare: 380000 },
  { month: '2025', agencyShare: 435750, agentShare: 435750 },
];

const PERIOD_LABELS: Record<Period, 'reports.periodMonthly' | 'reports.periodQuarterly' | 'reports.periodYearly'> = {
  monthly: 'reports.periodMonthly',
  quarterly: 'reports.periodQuarterly',
  yearly: 'reports.periodYearly',
};

export function FinancialReportsPage() {
  const { t, i18n } = useTranslation();
  const { transactions, getAgent } = useApp();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('monthly');

  const formatDate = (d: string) => formatDateForLocale(d, i18n.language);

  const completed = useMemo(() => transactions.filter(txn => txn.stage === 'completed'), [transactions]);

  const totalCommission = useMemo(() => completed.reduce((s, txn) => s + txn.transactionValue, 0), [completed]);
  const agencyShare = totalCommission * 0.5;
  const agentPayouts = useMemo(() => completed.reduce((s, txn) => s + calculateCommission(txn).agentTotal, 0), [completed]);

  const chartData = period === 'monthly' ? MONTHLY_DATA.map(d => ({ ...d, month: d.month })) :
    period === 'quarterly' ? QUARTERLY_DATA :
    YEARLY_DATA;

  const legendAgency = t('reports.legendAgencyShare');
  const legendAgents = t('reports.legendAgentPayouts');

  const summaryCards = useMemo(() => [
    { labelKey: 'reports.summaryTotalCommission' as const, value: formatCurrency(totalCommission), sub: t('reports.summarySubCompleted', { count: completed.length }), color: '#0A1628', bg: '#F8FAFC' },
    { labelKey: 'reports.summaryAgencyShare' as const, value: formatCurrency(agencyShare), sub: t('reports.summarySubCompany'), color: '#059669', bg: '#F0FDF4' },
    { labelKey: 'reports.summaryAgentPayouts' as const, value: formatCurrency(agentPayouts), sub: t('reports.summarySubDistributed'), color: '#D4A853', bg: '#FFFBEB' },
  ], [t, totalCommission, agencyShare, agentPayouts, completed.length]);

  function ReportsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; fill?: string }>; label?: string }) {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-[#0A1628] mb-2">{label}</p>
        {payload.map((p) => (
          <div key={String(p.name)} className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-[#64748B]">{p.name}:</span>
            <span className="font-semibold text-[#0A1628]">{formatCurrency(p.value ?? 0)}</span>
          </div>
        ))}
        <div className="border-t border-[#F1F5F9] mt-2 pt-2 flex justify-between">
          <span className="text-[#64748B]">{t('reports.tooltipTotal')}:</span>
          <span className="font-bold text-[#0A1628]">{formatCurrency(payload.reduce((s, p) => s + (p.value ?? 0), 0))}</span>
        </div>
      </div>
    );
  }

  const tableHeaders = [
    t('reports.tableProperty'),
    t('reports.tableDate'),
    t('reports.tableTotalFee'),
    t('reports.tableAgency50'),
    t('reports.tableAgentTotal'),
    t('reports.tableListingAgent'),
    t('reports.tableSellingAgent'),
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0A1628]">{t('reports.title')}</h1>
          <p className="text-[#64748B] text-sm mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
          <Download className="w-4 h-4" />
          {t('reports.export')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {summaryCards.map(card => (
          <div
            key={card.labelKey}
            className="rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6"
            style={{ backgroundColor: card.bg }}
          >
            <p className="text-sm text-[#64748B] font-medium mb-2">{t(card.labelKey)}</p>
            <p className="text-2xl font-bold mb-1" style={{ color: card.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {card.value}
            </p>
            <p className="text-xs text-[#94A3B8]">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4A853]" />
            <h3 className="text-[#0A1628]">{t('reports.chartTitle')}</h3>
          </div>
          <div className="flex rounded-xl border border-[#E2E8F0] overflow-hidden text-sm">
            {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 transition-colors ${period === p ? 'text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
                style={period === p ? { backgroundColor: '#0A1628' } : {}}
              >
                {t(PERIOD_LABELS[p])}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={(props) => <ReportsTooltip {...props} />} />
            <Legend
              formatter={(value) => <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>}
            />
            <Bar dataKey="agencyShare" name={legendAgency} fill="#0A1628" radius={[4, 4, 0, 0]} />
            <Bar dataKey="agentShare" name={legendAgents} fill="#D4A853" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#F1F5F9] justify-end">
          <p className="text-xs text-[#94A3B8]">
            {t('reports.splitNote')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-[#0A1628]">{t('reports.completedSectionTitle')}</h3>
          <p className="text-sm text-[#64748B] mt-0.5">{t('reports.completedSectionSubtitle', { count: completed.length })}</p>
        </div>

        {completed.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#94A3B8]">{t('reports.noCompleted')}</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAFBFC] border-b border-[#F1F5F9]">
                    {tableHeaders.map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {completed.map(txn => {
                    const la = getAgent(txn.listingAgentId);
                    const sa = getAgent(txn.sellingAgentId);
                    const isSame = txn.listingAgentId === txn.sellingAgentId;
                    const comm = calculateCommission(txn);
                    return (
                      <tr
                        key={txn.id}
                        onClick={() => navigate(`/transactions/${txn.id}`)}
                        className="hover:bg-[#FAFBFC] cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#0A1628] max-w-[180px] truncate">{txn.propertyAddress.split(',')[0]}</p>
                          <p className="text-xs text-[#94A3B8]">{txn.id}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">{formatDate(txn.date)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#0A1628]">{formatCurrency(txn.transactionValue)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#059669]">{formatCurrency(comm.company)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#D4A853]">{formatCurrency(comm.agentTotal)}</td>
                        <td className="px-5 py-4">
                          {la && <AgentChip agent={la} size="sm" />}
                          {la && <p className="text-xs text-[#D4A853] mt-0.5 pl-8">{formatCurrency(comm.listingAgent)}</p>}
                        </td>
                        <td className="px-5 py-4">
                          {isSame ? (
                            <span className="text-xs text-[#94A3B8] italic">{t('common.sameAgent')}</span>
                          ) : sa ? (
                            <>
                              <AgentChip agent={sa} size="sm" />
                              <p className="text-xs text-[#D4A853] mt-0.5 pl-8">{formatCurrency(comm.sellingAgent)}</p>
                            </>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#D4A853] transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0A1628]">
                    <td className="px-5 py-4 text-sm font-semibold text-white">{t('common.totals', { count: completed.length })}</td>
                    <td className="px-5 py-4" />
                    <td className="px-5 py-4 text-sm font-bold text-white">{formatCurrency(totalCommission)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-green-400">{formatCurrency(agencyShare)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#D4A853]">{formatCurrency(agentPayouts)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[#F1F5F9]">
              {completed.map(txn => {
                const comm = calculateCommission(txn);
                return (
                  <div
                    key={txn.id}
                    onClick={() => navigate(`/transactions/${txn.id}`)}
                    className="p-4 hover:bg-[#FAFBFC] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-[#0A1628]">{txn.propertyAddress.split(',')[0]}</p>
                      <StageBadge stage={txn.stage} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-[#94A3B8]">{t('reports.mobileTotal')}</p>
                        <p className="text-sm font-bold text-[#0A1628]">{formatCurrency(txn.transactionValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#94A3B8]">{t('reports.mobileAgency')}</p>
                        <p className="text-sm font-bold text-[#059669]">{formatCurrency(comm.company)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#94A3B8]">{t('reports.mobileAgents')}</p>
                        <p className="text-sm font-bold text-[#D4A853]">{formatCurrency(comm.agentTotal)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
