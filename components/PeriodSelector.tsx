'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PeriodSelectorProps {
  days: number;
  offset: number;
  fromDate: string;
  toDate: string;
  hasPrev: boolean;
  hasNext: boolean;
}

const PRESETS = [
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
];

function fmtDate(d: string): string {
  const date = new Date(d + 'T00:00:00Z');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

export default function PeriodSelector({ days, offset, fromDate, toDate, hasPrev, hasNext }: PeriodSelectorProps) {
  const router = useRouter();

  const go = (newDays: number, newOffset: number) => {
    const params = new URLSearchParams();
    if (newDays !== 7) params.set('days', String(newDays));
    if (newOffset > 0) params.set('offset', String(newOffset));
    const q = params.toString();
    router.push(q ? `?${q}` : '/');
  };

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    width: '26px', height: '26px', borderRadius: '7px', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(59,125,216,0.18)' : 'rgba(255,255,255,0.06)',
    color: active ? '#60A5FA' : '#334155',
    cursor: active ? 'pointer' : 'default',
    flexShrink: 0, padding: 0,
    transition: 'all 0.15s',
  });

  const presetStyle = (active: boolean): React.CSSProperties => ({
    height: '26px', padding: '0 10px', borderRadius: '7px', border: 'none',
    background: active ? '#3B7DD8' : 'rgba(255,255,255,0.07)',
    color: active ? 'white' : '#64748B',
    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: active ? '0 2px 8px rgba(59,125,216,0.40)' : 'none',
  });

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
        Dashboard de Funil
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PRESETS.map(p => (
            <button
              key={p.days}
              style={presetStyle(days === p.days)}
              onClick={() => go(p.days, 0)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />

        <button style={navBtnStyle(hasPrev)} onClick={() => hasPrev && go(days, offset + days)} disabled={!hasPrev} title="Período anterior">
          <ChevronLeft size={13} />
        </button>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, whiteSpace: 'nowrap' }}>
          {fmtDate(fromDate)} – {fmtDate(toDate)}
        </p>
        <button style={navBtnStyle(hasNext)} onClick={() => hasNext && go(days, Math.max(0, offset - days))} disabled={!hasNext} title="Período seguinte">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
