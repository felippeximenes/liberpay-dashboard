'use client';

import { useState, useCallback } from 'react';
import { WeeklySnapshot } from '@/types/snapshot';
import { WeekEntry } from './Sidebar';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Calendar, Loader2, X } from 'lucide-react';

interface Props {
  current: WeeklySnapshot;
  weeks: WeekEntry[];
  currentWeekKey?: string;
}

function formatWeekKey(key: string): string {
  const date = new Date(key + 'T00:00:00Z');
  if (isNaN(date.getTime())) return key;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
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
  { label: 'Leads',          get: d => d.ga4.leads,                 source: 'GA4' },
  { label: 'Deals criados',  get: d => d.pipedrive.dealsCreated,    source: 'Pipedrive' },
  { label: 'Deals ganhos',   get: d => d.pipedrive.dealsWon,        source: 'Pipedrive' },
  { label: 'Valor total',    get: d => d.pipedrive.totalValue,      source: 'Pipedrive', isCurrency: true },
  { label: 'Assinantes',     get: d => d.mailpoet.totalSubscribers, source: 'MailPoet' },
  { label: 'Taxa abertura',  get: d => d.mailpoet.openRate,         source: 'MailPoet', isRate: true },
];

export default function WeekComparison({ current, weeks, currentWeekKey }: Props) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [compData, setCompData] = useState<WeeklySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const available = weeks.filter(w => w.key !== currentWeekKey);

  const pickWeek = useCallback(async (w: WeekEntry) => {
    setPicking(false);
    setSelectedKey(w.key);
    setLoading(true);
    setError(false);
    setOpen(true);
    try {
      const res = await fetch(w.url);
      if (!res.ok) throw new Error();
      const data: WeeklySnapshot = await res.json();
      setCompData(data);
    } catch {
      setError(true);
      setCompData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = () => {
    setCompData(null);
    setSelectedKey(null);
    setOpen(false);
    setPicking(false);
    setError(false);
  };

  const currLabel = formatWeekShort(current.week);

  return (
    <div className="glass" style={{ marginBottom: '20px', overflow: 'hidden' }}>

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(59,125,216,0.15)', border: '1px solid rgba(59,125,216,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
            <Calendar size={15} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Comparativo de Semanas</p>
            <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0 0' }}>
              {selectedKey ? `${currLabel} vs ${formatWeekKey(selectedKey)}` : 'Escolha uma semana para comparar'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Clear button */}
          {selectedKey && (
            <button
              onClick={clear}
              style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Limpar comparativo"
            >
              <X size={13} />
            </button>
          )}

          {/* Pick week button */}
          {available.length > 0 ? (
            <button
              onClick={() => setPicking(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '9px',
                background: picking ? 'rgba(59,125,216,0.25)' : 'rgba(59,125,216,0.15)',
                border: `1px solid ${picking ? 'rgba(59,125,216,0.45)' : 'rgba(59,125,216,0.28)'}`,
                color: '#60A5FA', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {picking ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {selectedKey ? 'Trocar semana' : 'Escolher semana'}
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>Sem histórico ainda</span>
          )}

          {/* Collapse toggle — only when comparison is loaded */}
          {compData && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Week picker dropdown ── */}
      {picking && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', overflow: 'hidden' }}>
            {available.map((w, i) => (
              <button
                key={w.key}
                onClick={() => pickWeek(w)}
                style={{
                  width: '100%', padding: '11px 16px', background: selectedKey === w.key ? 'rgba(59,125,216,0.14)' : 'transparent',
                  border: 'none', borderBottom: i < available.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  color: selectedKey === w.key ? '#60A5FA' : '#CBD5E1', fontSize: '13px', fontWeight: selectedKey === w.key ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.15s',
                }}
              >
                <span>{formatWeekKey(w.key)}</span>
                {selectedKey === w.key && <span style={{ fontSize: '10px', background: 'rgba(59,125,216,0.25)', color: '#60A5FA', padding: '2px 8px', borderRadius: '20px' }}>selecionada</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#475569', fontSize: '13px' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Carregando dados da semana...
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div style={{ padding: '16px 20px', color: '#F87171', fontSize: '13px' }}>
          Não foi possível carregar os dados desta semana. Tente novamente.
        </div>
      )}

      {/* ── Comparison table ── */}
      {compData && open && !loading && (
        <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />

          {/* Column labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Métrica</span>
            <span style={{ fontSize: '10px', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>{currLabel}</span>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>{selectedKey ? formatWeekKey(selectedKey) : ''}</span>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingLeft: '24px' }}>Δ</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '4px' }} />

          {ROWS.map((row, i) => {
            const currVal = row.get(current);
            const prevVal = row.get(compData);
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
            Coluna azul = semana atual visualizada. Coluna cinza = semana selecionada para comparação. Dados salvos automaticamente toda sexta-feira.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
