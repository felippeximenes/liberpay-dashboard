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
    return (
      <span style={{ fontSize: '12px', color: '#B0BCCE', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Minus size={13} /> —
      </span>
    );
  }

  if (isRate) {
    const diff = current - previous;
    const up = diff >= 0;
    return (
      <span style={{ fontSize: '12px', fontWeight: 600, color: up ? '#00C0A0' : '#E03E5A', display: 'flex', alignItems: 'center', gap: '4px', background: up ? 'rgba(0,192,160,0.10)' : 'rgba(224,62,90,0.10)', padding: '3px 8px', borderRadius: '20px' }}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? '+' : ''}{diff.toFixed(1)}pp
      </span>
    );
  }

  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: '12px', fontWeight: 600, color: up ? '#00C0A0' : '#E03E5A', display: 'flex', alignItems: 'center', gap: '4px', background: up ? 'rgba(0,192,160,0.10)' : 'rgba(224,62,90,0.10)', padding: '3px 8px', borderRadius: '20px' }}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct.toFixed(0)}%
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
    <div className="glass" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
        Comparativo Semanal
      </h2>
      <p style={{ fontSize: '12px', color: '#A0ABBF', margin: '0 0 18px' }}>vs. semana anterior</p>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '360px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0 8px 12px 0', color: '#A0ABBF', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(237,241,251,0.90)' }}>
              Métrica
            </th>
            <th style={{ textAlign: 'right', padding: '0 8px 12px', color: '#A0ABBF', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(237,241,251,0.90)' }}>
              Atual
            </th>
            <th style={{ textAlign: 'right', padding: '0 8px 12px', color: '#A0ABBF', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(237,241,251,0.90)' }}>
              Anterior
            </th>
            <th style={{ textAlign: 'right', padding: '0 0 12px 8px', color: '#A0ABBF', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(237,241,251,0.90)' }}>
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label}>
              <td style={{ padding: '12px 8px 12px 0', fontWeight: 600, color: '#1A2340', borderBottom: i < rows.length - 1 ? '1px solid rgba(237,241,251,0.90)' : 'none' }}>
                {row.label}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#1A2340', borderBottom: i < rows.length - 1 ? '1px solid rgba(237,241,251,0.90)' : 'none' }}>
                {formatValue(row.current, row.isRate)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: '#8892A6', borderBottom: i < rows.length - 1 ? '1px solid rgba(237,241,251,0.90)' : 'none' }}>
                {formatValue(row.previous, row.isRate)}
              </td>
              <td style={{ padding: '12px 0 12px 8px', textAlign: 'right', borderBottom: i < rows.length - 1 ? '1px solid rgba(237,241,251,0.90)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Delta current={row.current} previous={row.previous} isRate={row.isRate} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
