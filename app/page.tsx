export const dynamic = 'force-dynamic';

import { WeeklySnapshot, DailySnapshot } from '@/types/snapshot';
import FunnelChart from '@/components/FunnelChart';
import SourceChart from '@/components/SourceChart';
import EmailStats from '@/components/EmailStats';
import WeeklyTable from '@/components/WeeklyTable';
import Sidebar, { DayEntry } from '@/components/Sidebar';
import PeriodSelector from '@/components/PeriodSelector';
import WeekComparison from '@/components/WeekComparison';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import ExportButton from '@/components/ExportButton';
import Image from 'next/image';
import { readFileSync } from 'fs';
import { join } from 'path';
import { list } from '@vercel/blob';
import { Eye, Zap, Users, TrendingUp, TrendingDown } from 'lucide-react';

function todayBRT(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().split('T')[0];
}

function shiftDate(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

async function getAvailableDays(): Promise<DayEntry[]> {
  try {
    const { blobs } = await list({ prefix: 'snapshots/days/' });
    return blobs
      .map(b => ({
        date: b.pathname.replace('snapshots/days/', '').replace('.json', ''),
        url: b.url,
      }))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

async function fetchDailySnapshot(url: string): Promise<DailySnapshot | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function aggregateSnapshots(
  snapshots: DailySnapshot[],
  label: string,
  prevSnapshots?: DailySnapshot[],
): WeeklySnapshot {
  const latest = snapshots[0];

  if (!latest) {
    const empty: WeeklySnapshot = {
      week: label,
      generatedAt: new Date().toISOString(),
      ga4: { visitors: 0, newUsers: 0, leads: 0, bySource: {}, topPages: [] },
      pipedrive: { leadsCreated: 0, dealsCreated: 0, dealsWon: 0, totalValue: 0 },
      mailpoet: { newSubscribers: 0, totalSubscribers: 0, openRate: 0, automationsActive: 0 },
      conversion: { transactions: null, revenue: null },
    };
    return empty;
  }

  const sum = (fn: (d: DailySnapshot) => number) =>
    snapshots.reduce((acc, d) => acc + fn(d), 0);

  const bySource: Record<string, number> = {};
  snapshots.forEach(d => {
    Object.entries(d.ga4.bySource ?? {}).forEach(([k, v]) => {
      bySource[k] = (bySource[k] ?? 0) + v;
    });
  });

  const pageMap: Record<string, number> = {};
  snapshots.forEach(d => {
    (d.ga4.topPages ?? []).forEach(p => {
      pageMap[p.page] = (pageMap[p.page] ?? 0) + p.views;
    });
  });
  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  const snapshot: WeeklySnapshot = {
    week: label,
    generatedAt: latest.generatedAt,
    ga4: {
      visitors: sum(d => d.ga4.visitors),
      newUsers: sum(d => d.ga4.newUsers),
      leads: sum(d => d.ga4.leads),
      bySource,
      topPages,
    },
    pipedrive: {
      leadsCreated: sum(d => d.pipedrive.leadsCreated),
      dealsCreated: sum(d => d.pipedrive.dealsCreated),
      dealsWon: sum(d => d.pipedrive.dealsWon),
      totalValue: sum(d => d.pipedrive.totalValue),
    },
    mailpoet: {
      newSubscribers: sum(d => d.mailpoet.newSubscribers),
      totalSubscribers: latest.mailpoet.totalSubscribers,
      openRate: snapshots.reduce((a, d) => a + d.mailpoet.openRate, 0) / snapshots.length,
      automationsActive: latest.mailpoet.automationsActive,
    },
    conversion: {
      transactions: snapshots.some(d => d.conversion.transactions !== null)
        ? sum(d => d.conversion.transactions ?? 0)
        : null,
      revenue: snapshots.some(d => d.conversion.revenue !== null)
        ? sum(d => d.conversion.revenue ?? 0)
        : null,
    },
  };

  if (prevSnapshots && prevSnapshots.length > 0) {
    snapshot.previousWeek = aggregateSnapshots(prevSnapshots, 'período anterior');
  }

  return snapshot;
}

function getMockData(): WeeklySnapshot {
  const filePath = join(process.cwd(), 'public', 'data', 'mock.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function fmtShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

type Health = 'good' | 'warning' | 'bad' | 'neutral';

function healthFromDelta(current: number | null, previous: number | null | undefined, zeroIsBad = false): Health {
  if (current === null) return 'neutral';
  if (zeroIsBad && current === 0) return 'bad';
  if (!previous || previous === 0) return 'neutral';
  const d = ((current - previous) / previous) * 100;
  if (d >= 5)   return 'good';
  if (d >= -10) return 'warning';
  return 'bad';
}

const HEALTH_DOT: Record<Health, { color: string; label: string }> = {
  good:    { color: '#34D399', label: 'Bom' },
  warning: { color: '#FCD34D', label: 'Atenção' },
  bad:     { color: '#F87171', label: 'Alerta' },
  neutral: { color: '#334155', label: '—' },
};

function HealthDot({ health }: { health: Health }) {
  const h = HEALTH_DOT[health];
  return (
    <span
      title={h.label}
      style={{
        position: 'absolute', top: '14px', right: '14px',
        width: '8px', height: '8px', borderRadius: '50%',
        background: h.color,
        boxShadow: health !== 'neutral' ? `0 0 6px ${h.color}` : 'none',
      }}
    />
  );
}

function DeltaBadge({ current, previous }: { current: number | null; previous: number | null | undefined }) {
  if (current === null || !previous || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '11px', fontWeight: 700,
      color: up ? '#34D399' : '#F87171',
      background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
      border: `1px solid ${up ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
      padding: '2px 7px', borderRadius: '20px', marginTop: '6px',
    }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { days?: string; offset?: string };
}) {
  const days = Math.max(1, Math.min(90, parseInt(searchParams.days ?? '7', 10) || 7));
  const offset = Math.max(0, parseInt(searchParams.offset ?? '0', 10) || 0);

  const today = todayBRT();
  const toDate = shiftDate(today, -offset);
  const fromDate = shiftDate(toDate, -(days - 1));

  const prevToDate = shiftDate(fromDate, -1);
  const prevFromDate = shiftDate(prevToDate, -(days - 1));

  const availableDays = await getAvailableDays();

  const currentEntries = availableDays.filter(d => d.date >= fromDate && d.date <= toDate);
  const prevEntries = availableDays.filter(d => d.date >= prevFromDate && d.date <= prevToDate);

  const hasPrev = availableDays.some(d => d.date < fromDate);
  const hasNext = offset > 0;

  let data: WeeklySnapshot;

  if (availableDays.length === 0) {
    data = getMockData();
  } else {
    const [currentRaw, prevRaw] = await Promise.all([
      Promise.all(currentEntries.map(e => fetchDailySnapshot(e.url))),
      Promise.all(prevEntries.map(e => fetchDailySnapshot(e.url))),
    ]);
    const currentSnapshots = currentRaw.filter((s): s is DailySnapshot => s !== null);
    const prevSnapshots = prevRaw.filter((s): s is DailySnapshot => s !== null);

    const periodLabel = `${fmtShortDate(fromDate)} – ${fmtShortDate(toDate)}`;
    data = aggregateSnapshots(currentSnapshots, periodLabel, prevSnapshots.length > 0 ? prevSnapshots : undefined);
  }

  const prev = data.previousWeek;

  const kpis = [
    {
      label: 'Sessões',
      value: data.ga4.visitors,
      prevValue: prev?.ga4.visitors ?? null,
      sub: `${data.ga4.newUsers.toLocaleString('pt-BR')} novos usuários`,
      gradient: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)',
      shadow: 'rgba(59,125,216,0.35)',
      icon: <Eye size={18} />,
      health: healthFromDelta(data.ga4.visitors, prev?.ga4.visitors),
    },
    {
      label: 'Leads gerados',
      value: data.pipedrive.leadsCreated,
      prevValue: prev?.pipedrive.leadsCreated ?? null,
      sub: 'caixa de entrada · Pipedrive',
      gradient: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)',
      shadow: 'rgba(123,111,208,0.35)',
      icon: <TrendingUp size={18} />,
      health: healthFromDelta(data.pipedrive.leadsCreated, prev?.pipedrive.leadsCreated, true),
    },
    {
      label: 'Deals criados',
      value: data.pipedrive.dealsCreated,
      prevValue: prev?.pipedrive.dealsCreated ?? null,
      sub: 'Pipedrive',
      gradient: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)',
      shadow: 'rgba(0,192,160,0.35)',
      icon: <Zap size={18} />,
      health: healthFromDelta(data.pipedrive.dealsCreated, prev?.pipedrive.dealsCreated),
    },
    {
      label: 'Novos assinantes',
      value: data.mailpoet.newSubscribers,
      prevValue: prev?.mailpoet.newSubscribers ?? null,
      sub: `${data.mailpoet.totalSubscribers.toLocaleString('pt-BR')} total MailPoet`,
      gradient: 'linear-gradient(135deg, #F0883E 0%, #F6B05E 100%)',
      shadow: 'rgba(240,136,62,0.35)',
      icon: <Users size={18} />,
      health: healthFromDelta(data.mailpoet.newSubscribers, prev?.mailpoet.newSubscribers),
    },
  ];

  const isEmpty = availableDays.length === 0;

  return (
    <div style={{ background: '#0B0F1E', minHeight: '100vh' }}>

      <Sidebar days={availableDays} data={data} />

      <div id="dashboard-print" className="layout-main">

        {/* Header */}
        <div className="header-row">
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
            <div style={{ background: '#1A3A70', borderRadius: '12px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(26,58,112,0.50)', flexShrink: 0, border: '1px solid rgba(59,125,216,0.30)' }}>
              <Image src="/logo.png" alt="LiberPay" width={100} height={28} className="object-contain" />
            </div>
            <PeriodSelector
              days={days}
              offset={offset}
              fromDate={fromDate}
              toDate={toDate}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <ExportButton data={data} />
            {!isEmpty && (
              <div className="glass" style={{ padding: '12px 20px', textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                  Última atualização
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1', margin: '4px 0 0' }}>
                  {new Date(data.generatedAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Banner: sem dados diários ainda */}
        {isEmpty && (
          <div style={{ padding: '14px 20px', marginBottom: '20px', borderRadius: '14px', background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.20)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FCD34D', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#FCD34D', margin: 0 }}>
              Aguardando dados diários — configure o Make.com para salvar snapshots em <strong>snapshots/days/YYYY-MM-DD.json</strong>. Exibindo dados de demonstração.
            </p>
          </div>
        )}

        {/* Resumo executivo */}
        <ExecutiveSummary data={data} />

        {/* KPI Cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Indicadores do período
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {([['good', '#34D399', 'Bom'], ['warning', '#FCD34D', 'Atenção'], ['bad', '#F87171', 'Alerta']] as const).map(([, color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#475569' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid-kpi">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass" style={{ padding: '22px', position: 'relative' }}>
              <HealthDot health={kpi.health} />
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: kpi.gradient, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', boxShadow: `0 6px 20px ${kpi.shadow}`,
              }}>
                {kpi.icon}
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                {kpi.label}
              </p>
              <p className="kpi-value">
                {kpi.value !== null ? kpi.value.toLocaleString('pt-BR') : '—'}
              </p>
              <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 0' }}>{kpi.sub}</p>
              <DeltaBadge current={kpi.value} previous={kpi.prevValue} />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid-2col" style={{ marginBottom: '20px' }}>
          <FunnelChart data={data} />
          <SourceChart data={data} />
        </div>

        {/* Bottom row */}
        <div className="grid-2col" style={{ marginBottom: '20px' }}>
          <EmailStats data={data} />
          <WeeklyTable data={data} />
        </div>

        {/* Comparativo de períodos */}
        <WeekComparison current={data} />

      </div>
    </div>
  );
}
