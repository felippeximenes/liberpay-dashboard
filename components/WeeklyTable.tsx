import { WeeklySnapshot } from '@/types/snapshot';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
      <span style={{ fontSize: '12px', color: '#B0BCCE' }}>—</span>
    );
  }

  if (isRate) {
    const diff = current - previous;
    const up = diff >= 0;
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, color: up ? '#00C0A0' : '#E03E5A', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {up ? '+' : ''}{diff.toFixed(1)}pp
      </span>
    );
  }

  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, color: up ? '#00C0A0' : '#E03E5A', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

const cellBorder = (i: number, total: number) =>
  i < total - 1 ? '1px solid rgba(237,241,251,0.90)' : 'none';

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
    <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
        Comparativo Semanal
      </h2>
      <p style={{ fontSize: '12px', color: '#A0ABBF', margin: '0 0 18px' }}>vs. semana anterior</p>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as 'auto', marginRight: '-4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '320px' }}>
          <thead>
            <tr>
              {['Métrica', 'Atual', 'Ant.', 'Δ'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: i === 0 ? '0 8px 12px 0' : '0 0 12px 8px',
                  color: '#A0ABBF', fontWeight: 600, fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  borderBottom: '1px solid rgba(237,241,251,0.90)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label}>
                <td style={{ padding: '11px 8px 11px 0', fontWeight: 600, color: '#1A2340', borderBottom: cellBorder(i, rows.length), whiteSpace: 'nowrap' }}>
                  {row.label}
                </td>
                <td style={{ padding: '11px 0 11px 8px', textAlign: 'right', fontWeight: 700, color: '#1A2340', borderBottom: cellBorder(i, rows.length), whiteSpace: 'nowrap' }}>
                  {formatValue(row.current, row.isRate)}
                </td>
                <td style={{ padding: '11px 0 11px 8px', textAlign: 'right', color: '#8892A6', borderBottom: cellBorder(i, rows.length), whiteSpace: 'nowrap' }}>
                  {formatValue(row.previous, row.isRate)}
                </td>
                <td style={{ padding: '11px 0 11px 8px', textAlign: 'right', borderBottom: cellBorder(i, rows.length) }}>
                  <Delta current={row.current} previous={row.previous} isRate={row.isRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
