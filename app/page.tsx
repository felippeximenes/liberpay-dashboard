export const dynamic = 'force-dynamic';

import { WeeklySnapshot } from '@/types/snapshot';
import FunnelChart from '@/components/FunnelChart';
import SourceChart from '@/components/SourceChart';
import EmailStats from '@/components/EmailStats';
import WeeklyTable from '@/components/WeeklyTable';
import Sidebar, { WeekEntry } from '@/components/Sidebar';
import WeekNav from '@/components/WeekNav';
import WeekComparison from '@/components/WeekComparison';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import ExportButton from '@/components/ExportButton';
import Image from 'next/image';
import { readFileSync } from 'fs';
import { join } from 'path';
import { list } from '@vercel/blob';
import { Eye, Zap, Users, TrendingUp, TrendingDown } from 'lucide-react';

async function getWeeks(): Promise<WeekEntry[]> {
  try {
    const { blobs } = await list({ prefix: 'snapshots/weeks/' });
    return blobs
      .map((b) => ({
        key: b.pathname.replace('snapshots/weeks/', '').replace('.json', ''),
        url: b.url,
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  } catch {
    return [];
  }
}

async function getSnapshotData(url?: string): Promise<WeeklySnapshot> {
  if (url) {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Falha ao buscar snapshot');
    return res.json();
  }
  const filePath = join(process.cwd(), 'public', 'data', 'mock.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function formatWeek(week: string): string {
  const parts = week.split('/');
  if (parts.length !== 2) return week;
  const [start, end] = parts;
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00Z');
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
  return `${fmt(start)} — ${fmt(end)}`;
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
  searchParams: { week?: string };
}) {
  const weeks = await getWeeks();

  const weekParam = searchParams.week;
  let snapshotUrl = process.env.NEXT_PUBLIC_SNAPSHOT_URL;

  if (weekParam) {
    // Semana específica selecionada pelo usuário
    const found = weeks.find((w) => w.key === weekParam);
    if (found) snapshotUrl = found.url;
  } else if (!snapshotUrl && weeks.length > 0) {
    // Sem URL configurada → carrega automaticamente o blob mais recente
    snapshotUrl = weeks[0].url;
  }

  const data = await getSnapshotData(snapshotUrl);
  const weekLabel = formatWeek(data.week);
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
      label: 'Assinantes',
      value: data.mailpoet.totalSubscribers,
      prevValue: prev?.mailpoet.totalSubscribers ?? null,
      sub: 'total MailPoet',
      gradient: 'linear-gradient(135deg, #F0883E 0%, #F6B05E 100%)',
      shadow: 'rgba(240,136,62,0.35)',
      icon: <Users size={18} />,
      health: healthFromDelta(data.mailpoet.totalSubscribers, prev?.mailpoet.totalSubscribers),
    },
  ];

  return (
    <div style={{ background: '#0B0F1E', minHeight: '100vh' }}>

      <Sidebar weeks={weeks} currentWeek={weekParam} data={data} />

      <div id="dashboard-print" className="layout-main">

        {/* Header */}
        <div className="header-row">
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
            <div style={{ background: '#1A3A70', borderRadius: '12px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(26,58,112,0.50)', flexShrink: 0, border: '1px solid rgba(59,125,216,0.30)' }}>
              <Image src="/logo.png" alt="LiberPay" width={100} height={28} className="object-contain" />
            </div>
            <WeekNav weeks={weeks} currentWeek={weekParam} weekLabel={weekLabel} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <ExportButton data={data} />
            <div className="glass" style={{ padding: '12px 20px', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                Última atualização
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1', margin: '4px 0 0' }}>
                {new Date(data.generatedAt).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Resumo executivo automático */}
        <ExecutiveSummary data={data} />

        {/* KPI Cards */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Indicadores da semana
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

        {/* Comparativo de semanas — seleção manual */}
        <WeekComparison
          current={data}
          weeks={weeks}
          currentWeekKey={weekParam}
        />

      </div>
    </div>
  );
}
