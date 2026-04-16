import { useState } from 'react';
import { X, Building2, DollarSign, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../data/mockData';
import { toast } from 'sonner';

interface CreateTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTransactionModal({ open, onClose }: CreateTransactionModalProps) {
  const { agents, addTransaction } = useApp();
  const [form, setForm] = useState({
    propertyAddress: '',
    propertyType: 'sale' as 'sale' | 'rental',
    transactionValue: '',
    listingAgentId: '',
    sellingAgentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const value = parseFloat(form.transactionValue) || 0;
  const isSameAgent = form.listingAgentId && form.listingAgentId === form.sellingAgentId;
  const company = value * 0.5;
  const agentTotal = value * 0.5;
  const listingAgent = isSameAgent ? agentTotal : agentTotal * 0.5;
  const sellingAgent = isSameAgent ? 0 : agentTotal * 0.5;

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.propertyAddress.trim()) errs.propertyAddress = 'Property address is required.';
    if (!form.transactionValue || value <= 0) errs.transactionValue = 'Enter a valid transaction value.';
    if (!form.listingAgentId) errs.listingAgentId = 'Select a listing agent.';
    if (!form.sellingAgentId) errs.sellingAgentId = 'Select a selling agent.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addTransaction({
      propertyAddress: form.propertyAddress,
      propertyType: form.propertyType,
      transactionValue: value,
      stage: 'agreement',
      listingAgentId: form.listingAgentId,
      sellingAgentId: form.sellingAgentId,
      date: new Date().toISOString().split('T')[0],
    });
    toast.success('Transaction created successfully.');
    onClose();
    setForm({ propertyAddress: '', propertyType: 'sale', transactionValue: '', listingAgentId: '', sellingAgentId: '' });
    setErrors({});
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#0A1628] text-sm bg-white focus:outline-none focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/20 transition-all";
  const labelClass = "block text-sm font-medium text-[#0A1628] mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-[#0A1628]">New Transaction</h2>
            <p className="text-sm text-[#64748B] mt-0.5">Create a new property transaction record</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Left: Form */}
          <div className="flex-1 p-6 space-y-5 border-b md:border-b-0 md:border-r border-[#E2E8F0]">
            <div>
              <label className={labelClass}>
                <Building2 className="inline w-4 h-4 mr-1 text-[#64748B]" />
                Property Address
              </label>
              <input
                className={inputClass}
                placeholder="e.g. 42 Harrington Gardens, London SW7"
                value={form.propertyAddress}
                onChange={e => setForm(p => ({ ...p, propertyAddress: e.target.value }))}
              />
              {errors.propertyAddress && <p className={errorClass}>{errors.propertyAddress}</p>}
            </div>

            <div>
              <label className={labelClass}>Property Type</label>
              <div className="flex gap-3">
                {(['sale', 'rental'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, propertyType: type }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                      form.propertyType === type
                        ? 'border-[#D4A853] bg-[#FEF3C7] text-[#B45309]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:border-[#D4A853]/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <DollarSign className="inline w-4 h-4 mr-1 text-[#64748B]" />
                Transaction Value (Total Service Fee)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">€</span>
                <input
                  className={`${inputClass} pl-7`}
                  type="number"
                  min="0"
                  step="500"
                  placeholder="0"
                  value={form.transactionValue}
                  onChange={e => setForm(p => ({ ...p, transactionValue: e.target.value }))}
                />
              </div>
              {errors.transactionValue && <p className={errorClass}>{errors.transactionValue}</p>}
            </div>

            <div>
              <label className={labelClass}>
                <Users className="inline w-4 h-4 mr-1 text-[#64748B]" />
                Listing Agent
              </label>
              <select
                className={inputClass}
                value={form.listingAgentId}
                onChange={e => setForm(p => ({ ...p, listingAgentId: e.target.value }))}
              >
                <option value="">Select agent...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.title}</option>
                ))}
              </select>
              {errors.listingAgentId && <p className={errorClass}>{errors.listingAgentId}</p>}
            </div>

            <div>
              <label className={labelClass}>Selling Agent</label>
              <select
                className={inputClass}
                value={form.sellingAgentId}
                onChange={e => setForm(p => ({ ...p, sellingAgentId: e.target.value }))}
              >
                <option value="">Select agent...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.title}</option>
                ))}
              </select>
              {errors.sellingAgentId && <p className={errorClass}>{errors.sellingAgentId}</p>}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-full md:w-72 p-6 bg-[#FAFBFC]">
            <h3 className="text-sm font-semibold text-[#0A1628] mb-4">Commission Preview</h3>
            {value > 0 ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                  <div className="text-xs text-[#64748B] mb-1">Total Service Fee</div>
                  <div className="text-xl font-bold text-[#0A1628]">{formatCurrency(value)}</div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0A1628]" />
                      <span className="text-xs font-medium text-[#64748B]">Agency (50%)</span>
                    </div>
                    <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(company)}</span>
                  </div>

                  {isSameAgent ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D4A853]" />
                        <span className="text-xs font-medium text-[#64748B]">Agent (50%)</span>
                      </div>
                      <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(listingAgent)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D4A853]" />
                          <span className="text-xs font-medium text-[#64748B]">Listing (25%)</span>
                        </div>
                        <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(listingAgent)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E2E8F0]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                          <span className="text-xs font-medium text-[#64748B]">Selling (25%)</span>
                        </div>
                        <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(sellingAgent)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Bar visualization */}
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-[#0A1628] rounded-l-full" style={{ width: '50%' }} />
                  {isSameAgent ? (
                    <div className="bg-[#D4A853] rounded-r-full" style={{ width: '50%' }} />
                  ) : (
                    <>
                      <div className="bg-[#D4A853]" style={{ width: '25%' }} />
                      <div className="bg-[#F59E0B] rounded-r-full" style={{ width: '25%' }} />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#94A3B8] text-sm">
                Enter a transaction value to see the commission preview.
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#D4A853' }}
          >
            Create Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
