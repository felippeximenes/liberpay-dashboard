import { WeeklySnapshot } from '@/types/snapshot';
import FunnelChart from '@/components/FunnelChart';
import SourceChart from '@/components/SourceChart';
import EmailStats from '@/components/EmailStats';
import WeeklyTable from '@/components/WeeklyTable';
import Sidebar, { WeekEntry } from '@/components/Sidebar';
import InsightCards from '@/components/InsightCards';
import WeekNav from '@/components/WeekNav';
import Image from 'next/image';
import { readFileSync } from 'fs';
import { join } from 'path';
import { list } from '@vercel/blob';
import { Eye, Zap, Users, TrendingUp } from 'lucide-react';

async function getWeeks(): Promise<WeekEntry[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const weeks = await getWeeks();

  const weekParam = searchParams.week;
  let snapshotUrl = process.env.NEXT_PUBLIC_SNAPSHOT_URL;
  if (weekParam) {
    const found = weeks.find((w) => w.key === weekParam);
    if (found) snapshotUrl = found.url;
  }

  const data = await getSnapshotData(snapshotUrl);
  const weekLabel = formatWeek(data.week);

  const kpis = [
    {
      label: 'Visitantes',
      value: data.ga4.visitors,
      sub: `${data.ga4.newUsers.toLocaleString('pt-BR')} novos usuários`,
      gradient: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)',
      shadow: 'rgba(59,125,216,0.30)',
      icon: <Eye size={18} />,
    },
    {
      label: 'Leads gerados',
      value: data.ga4.leads,
      sub: 'eventos registrados',
      gradient: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)',
      shadow: 'rgba(123,111,208,0.30)',
      icon: <TrendingUp size={18} />,
    },
    {
      label: 'Deals criados',
      value: data.pipedrive.dealsCreated,
      sub: 'no Pipedrive esta semana',
      gradient: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)',
      shadow: 'rgba(0,192,160,0.30)',
      icon: <Zap size={18} />,
    },
    {
      label: 'Assinantes',
      value: data.mailpoet.totalSubscribers,
      sub: 'total na lista MailPoet',
      gradient: 'linear-gradient(135deg, #F0883E 0%, #F6B05E 100%)',
      shadow: 'rgba(240,136,62,0.30)',
      icon: <Users size={18} />,
    },
  ];

  return (
    <div style={{ background: 'linear-gradient(135deg, #EDF1FB 0%, #E8F3FD 55%, #EEF0FC 100%)', minHeight: '100vh' }}>

      <Sidebar weeks={weeks} currentWeek={weekParam} data={data} />

      <div id="dashboard-print" className="layout-main">

        {/* Header */}
        <div className="header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1A56A0', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(26,86,160,0.30)', flexShrink: 0 }}>
              <Image src="/logo.png" alt="LiberPay" width={100} height={28} className="object-contain" />
            </div>
            <WeekNav weeks={weeks} currentWeek={weekParam} weekLabel={weekLabel} />
          </div>
          <div className="glass" style={{ padding: '12px 20px', textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '11px', color: '#A0ABBF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
              Última atualização
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2340', margin: '4px 0 0' }}>
              {new Date(data.generatedAt).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
              })}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid-kpi">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass" style={{ padding: '22px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: kpi.gradient, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px', boxShadow: `0 6px 16px ${kpi.shadow}`,
              }}>
                {kpi.icon}
              </div>
              <p style={{ fontSize: '11px', color: '#A0ABBF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                {kpi.label}
              </p>
              <p className="kpi-value">
                {kpi.value !== null ? kpi.value.toLocaleString('pt-BR') : '—'}
              </p>
              <p style={{ fontSize: '12px', color: '#B0BCCE', margin: 0 }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Insights */}
        <InsightCards data={data} />

        {/* Charts */}
        <div className="grid-2col" style={{ marginBottom: '20px' }}>
          <FunnelChart data={data} />
          <SourceChart data={data} />
        </div>

        {/* Bottom row */}
        <div className="grid-2col">
          <EmailStats data={data} />
          <WeeklyTable data={data} />
        </div>

      </div>
    </div>
  );
}
