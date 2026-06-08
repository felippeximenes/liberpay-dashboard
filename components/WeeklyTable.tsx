import { WeeklySnapshot } from '@/types/snapshot';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Row {
  label: string;
  current: number | null;
  previous: number | null;
  isRate?: boolean;
}

function formatValue(value: number | null, isRate?: boolean): string {
  if (value === null) return '—';
  if (isRate) return `${value.toFixed(1)}%`;
  return value.toLocaleString('pt-BR');
}

function Delta({ current, previous, isRate }: { current: number | null; previous: number | null; isRate?: boolean }) {
  if (current === null || previous === null || previous === 0) {
    return <span className="text-gray-400 text-sm flex items-center gap-1"><Minus size={14} /> —</span>;
  }

  if (isRate) {
    const diff = current - previous;
    const isPositive = diff >= 0;
    return (
      <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? '+' : ''}{diff.toFixed(1)}pp
      </span>
    );
  }

  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  return (
    <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {isPositive ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

export default function WeeklyTable({ data }: { data: WeeklySnapshot }) {
  const prev = data.previousWeek;

  const rows: Row[] = [
    { label: 'Visitantes', current: data.ga4.visitors, previous: prev?.ga4.visitors ?? null },
    { label: 'Leads', current: data.ga4.leads, previous: prev?.ga4.leads ?? null },
    { label: 'Deals criados', current: data.pipedrive.dealsCreated, previous: prev?.pipedrive.dealsCreated ?? null },
    { label: 'Novos assinantes', current: data.mailpoet.newSubscribers, previous: prev?.mailpoet.newSubscribers ?? null },
    { label: 'Taxa de abertura', current: data.mailpoet.openRate, previous: prev?.mailpoet.openRate ?? null, isRate: true },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Comparativo Semanal</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Métrica</th>
            <th className="text-right py-2 px-3 text-gray-500 font-medium">Semana Atual</th>
            <th className="text-right py-2 px-3 text-gray-500 font-medium">Semana Anterior</th>
            <th className="text-right py-2 px-3 text-gray-500 font-medium">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 font-medium text-gray-700">{row.label}</td>
              <td className="py-3 px-3 text-right font-bold text-gray-800">
                {formatValue(row.current, row.isRate)}
              </td>
              <td className="py-3 px-3 text-right text-gray-500">
                {formatValue(row.previous, row.isRate)}
              </td>
              <td className="py-3 px-3 text-right">
                <Delta current={row.current} previous={row.previous} isRate={row.isRate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
