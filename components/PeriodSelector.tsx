'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

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

function fmtSingleDate(d: string): string {
  const date = new Date(d + 'T00:00:00Z');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function fmtShort(d: string): string {
  const date = new Date(d + 'T00:00:00Z');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

function todayBRT(): string {
  return new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0];
}

export default function PeriodSelector({ days, offset, fromDate, toDate, hasPrev, hasNext }: PeriodSelectorProps) {
  const router = useRouter();
  const isSingleDay = days === 1;
  const calendarRef = useRef<HTMLInputElement>(null);

  const go = (newDays: number, newOffset: number) => {
    const params = new URLSearchParams();
    if (newDays !== 1) params.set('days', String(newDays));
    if (newOffset > 0) params.set('offset', String(newOffset));
    const q = params.toString();
    router.push(q ? `?${q}` : '/');
  };

  const openCalendar = () => {
    if (!calendarRef.current) return;
    try { calendarRef.current.showPicker(); } catch { calendarRef.current.click(); }
  };

  const handleCalendar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (!selected) return;
    const today = todayBRT();
    const diffMs = new Date(today + 'T00:00:00Z').getTime() - new Date(selected + 'T00:00:00Z').getTime();
    const diffDays = Math.round(diffMs / 86400000);
    go(1, Math.max(0, diffDays));
  };

  const navBtn = (active: boolean): React.CSSProperties => ({
    width: '28px', height: '28px', borderRadius: '8px', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(59,125,216,0.18)' : 'rgba(255,255,255,0.06)',
    color: active ? '#60A5FA' : '#334155',
    cursor: active ? 'pointer' : 'default',
    flexShrink: 0, padding: 0, transition: 'all 0.15s',
  });

  const presetBtn = (active: boolean): React.CSSProperties => ({
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>

        {/* Navegação dia a dia */}
        <button style={navBtn(hasPrev)} onClick={() => hasPrev && go(days, offset + days)} disabled={!hasPrev} title="Anterior">
          <ChevronLeft size={13} />
        </button>

        {isSingleDay ? (
          <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {fmtSingleDate(toDate)}
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: '#64748B', whiteSpace: 'nowrap' }}>
            {fmtShort(fromDate)} – {fmtShort(toDate)}
          </span>
        )}

        <button style={navBtn(hasNext)} onClick={() => hasNext && go(days, Math.max(0, offset - days))} disabled={!hasNext} title="Próximo">
          <ChevronRight size={13} />
        </button>

        {/* Calendário — sempre visível */}
        <div
          style={{ ...navBtn(false), color: '#475569', cursor: 'pointer', position: 'relative' }}
          title="Selecionar data"
          onClick={openCalendar}
        >
          <CalendarDays size={13} />
          <input
            ref={calendarRef}
            type="date"
            value={toDate}
            max={todayBRT()}
            onChange={handleCalendar}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          />
        </div>

        {/* Hoje — aparece quando não está no dia atual */}
        {(!isSingleDay || offset > 0) && (
          <button
            style={{ ...presetBtn(false), color: '#94A3B8' }}
            onClick={() => go(1, 0)}
            title="Ir para hoje"
          >
            Hoje
          </button>
        )}

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />

        {/* Presets de período agregado */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {PRESETS.map(p => (
            <button key={p.days} style={presetBtn(days === p.days)} onClick={() => go(p.days, 0)}>
              {p.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
