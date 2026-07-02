'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
  current: WeeklySnapshot;
}

function formatVal(v: number | null, isCurrency?: boolean, isRate?: boolean): string {
  if (v === null) return '—';
  if (isCurrency) return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (isRate) return `${v.toFixed(1)}%`;
  return v.toLocaleString('pt-BR');
}

function Delta({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr === null || prev === null || prev === 0) {
    return <span style={{ fontSize: '11px', color: '#475569' }}>—</span>;
  }
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) {
    return <span style={{ fontSize: '11px', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Minus size={10} /> 0%</span>;
  }
  const up = pct > 0;
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: up ? '#34D399' : '#F87171', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

const ROWS: { label: string; get: (d: WeeklySnapshot) => number | null; source: string; isCurrency?: boolean; isRate?: boolean }[] = [
  { label: 'Sessões',        get: d => d.ga4.visitors,              source: 'GA4' },
  { label: 'Novos usuários', get: d => d.ga4.newUsers,              source: 'GA4' },
  { label: 'Leads',          get: d => d.pipedrive.leadsCreated,    source: 'Pipedrive' },
  { label: 'Deals criados',  get: d => d.pipedrive.dealsCreated,    source: 'Pipedrive' },
  { label: 'Deals ganhos',   get: d => d.pipedrive.dealsWon,        source: 'Pipedrive' },
  { label: 'Valor total',    get: d => d.pipedrive.totalValue,      source: 'Pipedrive', isCurrency: true },
  { label: 'Assinantes',     get: d => d.mailpoet.totalSubscribers, source: 'MailPoet' },
  { label: 'Taxa abertura',  get: d => d.mailpoet.openRate,         source: 'MailPoet', isRate: true },
];

export default function WeekComparison({ current }: Props) {
  const [open, setOpen] = useState(true);
  const comp = current.previousWeek;

  return (
    <div className="glass" style={{ marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(59,125,216,0.15)', border: '1px solid rgba(59,125,216,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
            <Calendar size={15} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Comparativo de Períodos</p>
            <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0 0' }}>
              {comp ? `${current.week} vs período anterior` : 'Período anterior ainda sem dados'}
            </p>
          </div>
        </div>

        {comp && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {!comp && (
        <div style={{ padding: '0 20px 20px' }}>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Assim que houver dados suficientes para o período anterior, a comparação aparecerá aqui automaticamente.
          </p>
        </div>
      )}

      {comp && open && (
        <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Métrica</span>
            <span style={{ fontSize: '10px', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>{current.week}</span>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>Anterior</span>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>Δ</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '4px' }} />

          {ROWS.map((row, i) => {
            const currVal = row.get(current);
            const prevVal = row.get(comp);
            const isLast = i === ROWS.length - 1;
            return (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', padding: '9px 0', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#CBD5E1' }}>{row.label}</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: '4px' }}>{row.source}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', textAlign: 'right', paddingLeft: '24px', whiteSpace: 'nowrap' }}>
                  {formatVal(currVal, row.isCurrency, row.isRate)}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'right', paddingLeft: '24px', whiteSpace: 'nowrap' }}>
                  {formatVal(prevVal, row.isCurrency, row.isRate)}
                </span>
                <div style={{ textAlign: 'right', paddingLeft: '24px' }}>
                  <Delta curr={currVal} prev={prevVal} />
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: '11px', color: '#334155', margin: '14px 0 0', lineHeight: 1.6 }}>
            Coluna azul = período atual. Coluna cinza = mesmo intervalo imediatamente anterior. Atualizado diariamente.
          </p>
        </div>
      )}
    </div>
  );
}
