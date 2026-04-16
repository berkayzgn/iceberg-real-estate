import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronRight, Home, Building2, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ProgressStepper } from '../components/ProgressStepper';
import { CommissionSplit } from '../components/CommissionSplit';
import { AgentChip } from '../components/AgentChip';
import { StageBadge } from '../components/StageBadge';
import { relativeTimeFromNow } from '../../i18n/relativeTime';
import { formatDateForLocale } from '../../i18n/formatDate';
import {
  calculateCommission, formatCurrency,
  getNextStage, STAGE_COLORS
} from '../data/mockData';
import { toast } from 'sonner';

function ConfirmModal({ open, onClose, onConfirm, currentStage, nextStage }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStage: string;
  nextStage: string;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-[#0A1628]">{t('transactionDetail.confirmAdvanceTitle')}</h3>
        </div>
        <p className="text-sm text-[#64748B] mb-2">
          {t('transactionDetail.confirmAdvanceBody')}
        </p>
        <div className="flex items-center gap-3 p-3 bg-[#FAFBFC] rounded-xl mb-6 border border-[#E2E8F0]">
          <span className="text-sm font-semibold text-[#0A1628]">{currentStage}</span>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          <span className="text-sm font-semibold" style={{ color: '#D4A853' }}>{nextStage}</span>
        </div>
        <p className="text-xs text-[#94A3B8] mb-5">{t('transactionDetail.confirmAdvanceWarning')}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#D4A853' }}
          >
            {t('transactionDetail.confirmAdvance')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TransactionDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTransaction, getAgent, advanceStage } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);

  const formatDate = (d: string) => formatDateForLocale(d, i18n.language);

  const transaction = getTransaction(id!);
  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-[#CBD5E1]" />
        <p className="text-[#64748B]">{t('transactionDetail.notFound')}</p>
        <button onClick={() => navigate('/transactions')} className="text-[#D4A853] font-medium">
          {t('transactionDetail.backToList')}
        </button>
      </div>
    );
  }

  const listingAgent = getAgent(transaction.listingAgentId);
  const sellingAgent = getAgent(transaction.sellingAgentId);
  const isSameAgent = transaction.listingAgentId === transaction.sellingAgentId;
  const comm = calculateCommission(transaction);
  const nextStage = getNextStage(transaction.stage);
  const stageColor = STAGE_COLORS[transaction.stage];

  function handleAdvance() {
    const toStage = getNextStage(transaction!.stage);
    advanceStage(transaction!.id);
    setShowConfirm(false);
    if (toStage) {
      toast.success(
        toStage === 'completed'
          ? t('transactionDetail.toastStageCompleted')
          : t('transactionDetail.toastStageAdvanced', { stage: t(`stages.${toStage}`) })
      );
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0A1628] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        {t('transactionDetail.backToList')}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: stageColor.bg }}>
              {transaction.propertyType === 'sale' ? (
                <Building2 className="w-6 h-6" style={{ color: stageColor.text }} />
              ) : (
                <Home className="w-6 h-6" style={{ color: stageColor.text }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-[#0A1628] text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {transaction.propertyAddress.split(',')[0]}
                </h1>
                <StageBadge stage={transaction.stage} />
              </div>
              <p className="text-sm text-[#64748B]">{transaction.propertyAddress}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(transaction.date)}
                </span>
                <span className="text-xs text-[#64748B]">{t('common.ref')}: {transaction.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${transaction.propertyType === 'sale' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {t(`propertyType.${transaction.propertyType}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Value & CTA */}
          <div className="flex flex-col items-start lg:items-end gap-3">
            <div>
              <p className="text-xs text-[#64748B] text-right">{t('transactionDetail.totalServiceFee')}</p>
              <p className="text-2xl font-bold text-[#0A1628]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {formatCurrency(transaction.transactionValue)}
              </p>
            </div>
            {nextStage ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ backgroundColor: '#D4A853' }}
              >
                {t('transactionDetail.advanceTo', { stage: t(`stages.${nextStage}`) })}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                {t('transactionDetail.completed')}
              </div>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="border-t border-[#F1F5F9] pt-6">
          <ProgressStepper currentStage={transaction.stage} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Commission Split */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
          <h3 className="text-[#0A1628] mb-5">{t('transactionDetail.commissionBreakdown')}</h3>
          <CommissionSplit
            company={comm.company}
            listingAgent={comm.listingAgent}
            sellingAgent={comm.sellingAgent}
            listingAgentName={listingAgent?.name ?? t('transactionDetail.fallbackListingAgent')}
            sellingAgentName={sellingAgent?.name ?? t('transactionDetail.fallbackSellingAgent')}
            isSameAgent={isSameAgent}
          />
        </div>

        {/* Agent Assignments */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
          <h3 className="text-[#0A1628] mb-5">{t('transactionDetail.agentAssignments')}</h3>
          <div className="space-y-4">
            {listingAgent && (
              <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.listingAgent')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{t('transactionDetail.listing')}</span>
                </div>
                <AgentChip agent={listingAgent} role={listingAgent.title} />
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">{t('transactionDetail.earnings')}</span>
                    <span className="text-sm font-bold text-[#D4A853]">{formatCurrency(comm.listingAgent)}</span>
                  </div>
                </div>
              </div>
            )}

            {!isSameAgent && sellingAgent && (
              <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('transactions.sellingAgent')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">{t('transactionDetail.selling')}</span>
                </div>
                <AgentChip agent={sellingAgent} role={sellingAgent.title} />
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">{t('transactionDetail.earnings')}</span>
                    <span className="text-sm font-bold text-[#D4A853]">{formatCurrency(comm.sellingAgent)}</span>
                  </div>
                </div>
              </div>
            )}

            {isSameAgent && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  {t('transactionDetail.sameAgentNote', { amount: formatCurrency(comm.listingAgent) })}
                </p>
              </div>
            )}

            {/* Agency share */}
            <div className="p-4 rounded-xl border border-[#E2E8F0]" style={{ backgroundColor: '#0A1628' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t('transactionDetail.agencyShare')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">50%</span>
              </div>
              <p className="text-sm font-bold text-white">PropEx Agency</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">{t('transactionDetail.revenue')}</span>
                  <span className="text-sm font-bold text-[#D4A853]">{formatCurrency(comm.company)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
          <h3 className="text-[#0A1628] mb-5">{t('transactionDetail.activityLog')}</h3>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#E2E8F0]" />
            <div className="space-y-5">
              {[...transaction.activityLog].reverse().map((entry, idx) => (
                <div key={entry.id} className="flex gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white ${
                    entry.type === 'stage_change' ? 'bg-[#0A1628]' :
                    entry.type === 'financial' ? 'bg-[#D4A853]' : 'bg-[#94A3B8]'
                  }`}>
                    {entry.type === 'stage_change' ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5 pb-1">
                    <p className="text-sm text-[#0A1628] leading-relaxed">{entry.description}</p>
                    {entry.fromStage && entry.toStage && (
                      <div className="flex items-center gap-2 mt-1">
                        <StageBadge stage={entry.fromStage} size="sm" />
                        <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                        <StageBadge stage={entry.toStage} size="sm" />
                      </div>
                    )}
                    <p className="text-xs text-[#94A3B8] mt-1">{relativeTimeFromNow(entry.timestamp, t, formatDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleAdvance}
        currentStage={t(`stages.${transaction.stage}`)}
        nextStage={nextStage ? t(`stages.${nextStage}`) : ''}
      />
    </div>
  );
}
