'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekEntry } from './Sidebar';

interface WeekNavProps {
  weeks: WeekEntry[];
  currentWeek?: string;
  weekLabel: string;
}

export default function WeekNav({ weeks, currentWeek, weekLabel }: WeekNavProps) {
  const router = useRouter();

  // weeks sorted newest-first; -1 = showing latest
  const idx = currentWeek ? weeks.findIndex(w => w.key === currentWeek) : -1;

  const canPrev = idx === -1 ? weeks.length > 0 : idx < weeks.length - 1;
  const canNext = idx >= 0;

  const goPrev = () => {
    if (!canPrev) return;
    if (idx === -1) router.push(`?week=${weeks[0].key}`);
    else router.push(`?week=${weeks[idx + 1].key}`);
  };

  const goNext = () => {
    if (!canNext) return;
    if (idx === 0) router.push('/');
    else router.push(`?week=${weeks[idx - 1].key}`);
  };

  const btn = (active: boolean): React.CSSProperties => ({
    width: '26px', height: '26px', borderRadius: '7px', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(59,125,216,0.12)' : 'rgba(200,211,232,0.25)',
    color: active ? '#3B7DD8' : '#C8D3E8',
    cursor: active ? 'pointer' : 'default',
    flexShrink: 0, padding: 0,
    transition: 'all 0.15s',
  });

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2340', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
        Dashboard de Funil
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button style={btn(canPrev)} onClick={goPrev} disabled={!canPrev} title="Semana anterior">
          <ChevronLeft size={13} />
        </button>
        <p style={{ fontSize: '13px', color: '#8892A6', margin: 0 }}>
          {weekLabel}
        </p>
        <button style={btn(canNext)} onClick={goNext} disabled={!canNext} title="Semana seguinte">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
