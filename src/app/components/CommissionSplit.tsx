import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../data/mockData';

interface CommissionSplitProps {
  company: number;
  listingAgent: number;
  sellingAgent: number;
  listingAgentName: string;
  sellingAgentName: string;
  isSameAgent: boolean;
}

export function CommissionSplit({
  company,
  listingAgent,
  sellingAgent,
  listingAgentName,
  sellingAgentName,
  isSameAgent,
}: CommissionSplitProps) {
  const { t } = useTranslation();
  const data = isSameAgent
    ? [
        { name: t('commission.agency'), value: company, color: '#0A1628' },
        { name: listingAgentName, value: listingAgent, color: '#D4A853' },
      ]
    : [
        { name: t('commission.agency'), value: company, color: '#0A1628' },
        { name: t('commission.listingRole', { name: listingAgentName }), value: listingAgent, color: '#D4A853' },
        { name: t('commission.sellingRole', { name: sellingAgentName }), value: sellingAgent, color: '#F59E0B' },
      ];

  const total = company + listingAgent + sellingAgent;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-[#64748B]">{t('commission.total')}</span>
          <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-[#64748B]">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[#0A1628]">{formatCurrency(item.value)}</span>
              <span className="text-xs text-[#64748B] ml-1">({((item.value / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Proportional bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex">
        {data.map((item) => (
          <div
            key={item.name}
            className="h-full"
            style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
    </div>
  );
}
