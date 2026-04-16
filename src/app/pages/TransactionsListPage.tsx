import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, ArrowUpDown, FileX, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { StageBadge } from '../components/StageBadge';
import { AgentChip } from '../components/AgentChip';
import { formatDateForLocale } from '../../i18n/formatDate';
import { Stage, STAGE_ORDER, calculateCommission, formatCurrency } from '../data/mockData';

type SortKey = 'date' | 'transactionValue' | 'stage';
type SortDir = 'asc' | 'desc';

export function TransactionsListPage() {
  const { t, i18n } = useTranslation();
  const { transactions, agents, getAgent } = useApp();
  const navigate = useNavigate();
  const formatDate = (d: string) => formatDateForLocale(d, i18n.language);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rental'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const matchSearch = !search || t.propertyAddress.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
        const matchStage = stageFilter === 'all' || t.stage === stageFilter;
        const matchAgent = agentFilter === 'all' || t.listingAgentId === agentFilter || t.sellingAgentId === agentFilter;
        const matchType = typeFilter === 'all' || t.propertyType === typeFilter;
        return matchSearch && matchStage && matchAgent && matchType;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortKey === 'transactionValue') cmp = a.transactionValue - b.transactionValue;
        if (sortKey === 'stage') cmp = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [transactions, search, stageFilter, agentFilter, typeFilter, sortKey, sortDir]);

  const SortButton = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(sk)}
      className="flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0A1628] transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-colors ${sortKey === sk ? 'text-[#D4A853]' : 'text-[#CBD5E1]'}`} />
    </button>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#0A1628]">{t('transactions.title')}</h1>
        <p className="text-[#64748B] text-sm mt-0.5">{t('transactions.totalCount', { count: transactions.length })}</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0A1628] placeholder-[#94A3B8] bg-[#FAFBFC] focus:outline-none focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/20 transition-all"
              placeholder={t('transactions.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />
            <select
              className="py-2 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0A1628] bg-[#FAFBFC] focus:outline-none focus:border-[#D4A853] transition-all cursor-pointer"
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value as Stage | 'all')}
            >
              <option value="all">{t('transactions.allStages')}</option>
              {STAGE_ORDER.map(s => <option key={s} value={s}>{t(`stages.${s}`)}</option>)}
            </select>
          </div>

          {/* Agent filter */}
          <select
            className="py-2 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0A1628] bg-[#FAFBFC] focus:outline-none focus:border-[#D4A853] transition-all cursor-pointer"
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
          >
            <option value="all">{t('transactions.allAgents')}</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Type filter */}
          <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden text-sm">
            {(['all', 'sale', 'rental'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 transition-colors ${typeFilter === type ? 'bg-[#0A1628] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
              >
                {type === 'all' ? t('common.all') : t(`propertyType.${type}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] py-20 flex flex-col items-center justify-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
            <FileX className="w-8 h-8 text-[#CBD5E1]" />
          </div>
          <div className="text-center">
            <h3 className="text-[#0A1628]">{t('transactions.noResultsTitle')}</h3>
            <p className="text-sm text-[#64748B] mt-1">{t('transactions.noResultsHint')}</p>
          </div>
          <button
            onClick={() => { setSearch(''); setStageFilter('all'); setAgentFilter('all'); setTypeFilter('all'); }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            {t('transactions.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#FAFBFC]">
                  <th className="text-left px-5 py-3.5">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.property')}</span>
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <SortButton label={t('transactions.value')} sortKey="transactionValue" />
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <SortButton label={t('transactions.stage')} sortKey="stage" />
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.listingAgent')}</span>
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.sellingAgent')}</span>
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.commission')}</span>
                  </th>
                  <th className="text-left px-4 py-3.5">
                    <SortButton label={t('transactions.date')} sortKey="date" />
                  </th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {filtered.map(txn => {
                  const la = getAgent(txn.listingAgentId);
                  const sa = getAgent(txn.sellingAgentId);
                  const comm = calculateCommission(txn);
                  const isSame = txn.listingAgentId === txn.sellingAgentId;
                  return (
                    <tr
                      key={txn.id}
                      onClick={() => navigate(`/transactions/${txn.id}`)}
                      className="hover:bg-[#FAFBFC] cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[#0A1628] truncate max-w-[200px]">
                            {txn.propertyAddress.split(',')[0]}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#94A3B8]">{txn.id}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${txn.propertyType === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                              {t(`propertyType.${txn.propertyType}`)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#0A1628]">
                        {formatCurrency(txn.transactionValue)}
                      </td>
                      <td className="px-4 py-4">
                        <StageBadge stage={txn.stage} size="sm" />
                      </td>
                      <td className="px-4 py-4">
                        {la && <AgentChip agent={la} size="sm" />}
                      </td>
                      <td className="px-4 py-4">
                        {isSame ? (
                          <span className="text-xs text-[#94A3B8] italic">{t('common.sameAgent')}</span>
                        ) : sa ? (
                          <AgentChip agent={sa} size="sm" />
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-[#D4A853]">
                          {formatCurrency(comm.agentTotal)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#64748B]">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#D4A853] transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filtered.map(txn => {
              const la = getAgent(txn.listingAgentId);
              const comm = calculateCommission(txn);
              return (
                <div
                  key={txn.id}
                  onClick={() => navigate(`/transactions/${txn.id}`)}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-[#0A1628]">{txn.propertyAddress.split(',')[0]}</p>
                    <StageBadge stage={txn.stage} size="sm" />
                  </div>
                  <p className="text-xs text-[#94A3B8] mb-3">{txn.id} · {formatDate(txn.date)}</p>
                  <div className="flex items-center justify-between">
                    {la && <AgentChip agent={la} size="sm" />}
                    <div className="text-right">
                      <p className="text-xs text-[#64748B]">{t('transactions.mobileCommissionLabel')}</p>
                      <p className="text-sm font-bold text-[#D4A853]">{formatCurrency(comm.agentTotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-xs text-[#94A3B8] mt-4 text-center">
        {t('transactions.showing', { filtered: filtered.length, total: transactions.length })}
      </p>
    </div>
  );
}
