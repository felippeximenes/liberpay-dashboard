import { WeeklySnapshot } from '@/types/snapshot';
import FunnelChart from '@/components/FunnelChart';
import SourceChart from '@/components/SourceChart';
import EmailStats from '@/components/EmailStats';
import WeeklyTable from '@/components/WeeklyTable';
import Image from 'next/image';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LayoutDashboard, TrendingUp, Mail, Settings, Eye, Zap, Users } from 'lucide-react';

async function getSnapshotData(): Promise<WeeklySnapshot> {
  const blobUrl = process.env.NEXT_PUBLIC_SNAPSHOT_URL;
  if (blobUrl) {
    const res = await fetch(blobUrl, { next: { revalidate: 3600 } });
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

const NAV = [
  { icon: <LayoutDashboard size={20} />, active: true },
  { icon: <TrendingUp size={20} /> },
  { icon: <Mail size={20} /> },
  { icon: <Settings size={20} /> },
];

export default async function DashboardPage() {
  const data = await getSnapshotData();

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

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, width: '72px', height: '100vh', zIndex: 40,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.80)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0', gap: '6px',
        boxShadow: '2px 0 20px rgba(59,125,216,0.06)',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <Image src="/logo1.png" alt="LiberPay" width={44} height={44} className="object-contain" />
        </div>
        {NAV.map(({ icon, active }, i) => (
          <div key={i} style={{
            width: '44px', height: '44px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? '#3B7DD8' : 'transparent',
            color: active ? 'white' : '#A0ABBF',
            boxShadow: active ? '0 4px 14px rgba(59,125,216,0.35)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {icon}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: '72px', padding: '28px 32px 40px', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1A56A0', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(26,86,160,0.30)' }}>
              <Image src="/logo.png" alt="LiberPay" width={100} height={28} className="object-contain" />
            </div>
            <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2340', margin: 0, letterSpacing: '-0.3px' }}>
              Dashboard de Funil
            </h1>
            <p style={{ fontSize: '13px', color: '#8892A6', margin: '5px 0 0' }}>
              {formatWeek(data.week)}
            </p>
            </div>
          </div>
          <div className="glass" style={{ padding: '12px 20px', textAlign: 'right' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass" style={{ padding: '22px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: kpi.gradient, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: `0 6px 16px ${kpi.shadow}`,
              }}>
                {kpi.icon}
              </div>
              <p style={{ fontSize: '11px', color: '#A0ABBF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1A2340', margin: '5px 0 5px', letterSpacing: '-0.5px', lineHeight: 1 }}>
                {kpi.value !== null ? kpi.value.toLocaleString('pt-BR') : '—'}
              </p>
              <p style={{ fontSize: '12px', color: '#B0BCCE', margin: 0 }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <FunnelChart data={data} />
          <SourceChart data={data} />
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <EmailStats data={data} />
          <WeeklyTable data={data} />
        </div>

      </div>
    </div>
  );
}
