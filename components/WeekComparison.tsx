'use client';

import { useState } from 'react';
import { WeeklySnapshot } from '@/types/snapshot';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  current: WeeklySnapshot;
  previous: WeeklySnapshot;
  isHistorical: boolean;
}

function formatWeekShort(week: string): string {
  const parts = week.split('/');
  if (parts.length !== 2) return week;
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00Z');
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  };
  return `${fmt(parts[0])} – ${fmt(parts[1])}`;
}

function formatVal(v: number | null, isCurrency?: boolean): string {
  if (v === null) return '—';
  if (isCurrency) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return v.toLocaleString('pt-BR');
}

function Delta({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr === null || prev === null || prev === 0) {
    return <span style={{ fontSize: '11px', color: '#475569' }}>—</span>;
  }
  const pct = ((curr - prev) / prev) * 100;
  const up = pct > 0;
  const flat = Math.abs(pct) < 0.5;
  if (flat) return <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px' }}><Minus size={10} /> 0%</span>;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700,
      color: up ? '#34D399' : '#F87171',
      display: 'inline-flex', alignItems: 'center', gap: '2px',
    }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

const ROWS: { label: string; currFn: (d: WeeklySnapshot) => number | null; isCurrency?: boolean; source: string }[] = [
  { label: 'Sessões',        currFn: d => d.ga4.visitors,              source: 'GA4' },
  { label: 'Novos usuários', currFn: d => d.ga4.newUsers,              source: 'GA4' },
  { label: 'Leads',          currFn: d => d.ga4.leads,                 source: 'GA4' },
  { label: 'Deals criados',  currFn: d => d.pipedrive.dealsCreated,    source: 'Pipedrive' },
  { label: 'Deals ganhos',   currFn: d => d.pipedrive.dealsWon,        source: 'Pipedrive' },
  { label: 'Valor total',    currFn: d => d.pipedrive.totalValue,      source: 'Pipedrive', isCurrency: true },
  { label: 'Assinantes',     currFn: d => d.mailpoet.totalSubscribers, source: 'MailPoet' },
  { label: 'Taxa abertura',  currFn: d => d.mailpoet.openRate,         source: 'MailPoet' },
];

export default function WeekComparison({ current, previous, isHistorical }: Props) {
  const [open, setOpen] = useState(isHistorical);

  const currLabel = formatWeekShort(current.week);
  const prevLabel = formatWeekShort(previous.week);

  return (
    <div className="glass" style={{ marginBottom: '20px', overflow: 'hidden' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 24px', background: 'transparent', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B7DD8', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>
            Comparativo de Semanas
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', padding: '2px 8px', borderRadius: '20px' }}>
            {currLabel} vs {prevLabel}
          </span>
        </div>
        <div style={{ color: '#475569', flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Table */}
      {open && (
        <div style={{ padding: '0 24px 20px', overflowX: 'auto' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' }}>
            <thead>
              <tr>
                {['Métrica', 'Fonte', currLabel, prevLabel, 'Δ'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 0 || i === 1 ? 'left' : 'right',
                    padding: i === 0 ? '0 12px 10px 0' : '0 0 10px 12px',
                    color: '#475569', fontWeight: 600, fontSize: '10px',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                const currVal = row.currFn(current);
                const prevVal = row.currFn(previous);
                const isLast = i === ROWS.length - 1;
                const border = isLast ? 'none' : '1px solid rgba(255,255,255,0.05)';
                return (
                  <tr key={row.label}>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 600, color: '#CBD5E1', borderBottom: border, whiteSpace: 'nowrap' }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '10px 0 10px 12px', borderBottom: border }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                        {row.source}
                      </span>
                    </td>
                    <td style={{ padding: '10px 0 10px 12px', textAlign: 'right', fontWeight: 700, color: '#F1F5F9', borderBottom: border, whiteSpace: 'nowrap' }}>
                      {row.label === 'Taxa abertura' && currVal !== null ? `${(currVal as number).toFixed(1)}%` : formatVal(currVal, row.isCurrency)}
                    </td>
                    <td style={{ padding: '10px 0 10px 12px', textAlign: 'right', color: '#64748B', borderBottom: border, whiteSpace: 'nowrap' }}>
                      {row.label === 'Taxa abertura' && prevVal !== null ? `${(prevVal as number).toFixed(1)}%` : formatVal(prevVal, row.isCurrency)}
                    </td>
                    <td style={{ padding: '10px 0 10px 12px', textAlign: 'right', borderBottom: border }}>
                      <Delta curr={currVal} prev={prevVal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Legend */}
          <p style={{ fontSize: '11px', color: '#334155', margin: '12px 0 0', lineHeight: 1.6 }}>
            Semana selecionada ({currLabel}) comparada com a semana anterior ({prevLabel}). Dados salvos automaticamente toda sexta-feira pela automação Make.com.
          </p>
        </div>
      )}
    </div>
  );
}
