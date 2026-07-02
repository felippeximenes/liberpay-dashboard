'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Calendar, Download, FileText, ChevronRight } from 'lucide-react';
import { WeeklySnapshot } from '@/types/snapshot';

export interface DayEntry {
  date: string;
  url: string;
}

export type WeekEntry = DayEntry;

interface SidebarProps {
  days: DayEntry[];
  data: WeeklySnapshot;
}

function fmtDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function fmtDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' });
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function downloadCSV(data: WeeklySnapshot) {
  const rows = [
    ['Métrica', 'Valor', 'Período'],
    ['Visitantes', data.ga4.visitors, data.week],
    ['Novos Usuários', data.ga4.newUsers, data.week],
    ['Leads (Pipedrive)', data.pipedrive.leadsCreated, data.week],
    ['Deals Criados', data.pipedrive.dealsCreated, data.week],
    ['Deals Ganhos', data.pipedrive.dealsWon, data.week],
    ['Valor Total (R$)', data.pipedrive.totalValue, data.week],
    ['Total Assinantes', data.mailpoet.totalSubscribers, data.week],
    ['Novos Assinantes', data.mailpoet.newSubscribers, data.week],
    ['Taxa de Abertura (%)', data.mailpoet.openRate, data.week],
    ['Transações', data.conversion.transactions ?? '—', data.week],
  ];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `liberpay-funil-${data.week.replace(/[/–\s]/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Panel = 'days' | 'export' | null;

function NavIcon({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: '44px', height: '44px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#3B7DD8' : 'transparent',
        color: active ? 'white' : '#334155',
        boxShadow: active ? '0 4px 14px rgba(59,125,216,0.40)' : 'none',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {icon}
    </div>
  );
}

export default function Sidebar({ days, data }: SidebarProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const router = useRouter();

  const toggle = (p: Exclude<Panel, null>) => setPanel((prev) => (prev === p ? null : p));

  const goPreset = (numDays: number, offset = 0) => {
    const params = new URLSearchParams();
    if (numDays !== 7) params.set('days', String(numDays));
    if (offset > 0) params.set('offset', String(offset));
    const q = params.toString();
    router.push(q ? `?${q}` : '/');
    setPanel(null);
  };

  // Group days by month
  const grouped: { month: string; entries: DayEntry[] }[] = [];
  days.forEach(d => {
    const month = getMonthLabel(d.date);
    const last = grouped[grouped.length - 1];
    if (!last || last.month !== month) {
      grouped.push({ month, entries: [d] });
    } else {
      last.entries.push(d);
    }
  });

  const daysPanel = (
    <div className="sidebar-panel" style={{ width: '260px' }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Período de análise</p>
        <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
          {days.length > 0 ? `${days.length} dia${days.length > 1 ? 's' : ''} de dados` : 'Aguardando Make.com'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>

        {/* Presets */}
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 20px 8px' }}>
          Presets
        </p>
        {[{ label: 'Últimos 7 dias', days: 7 }, { label: 'Últimos 14 dias', days: 14 }, { label: 'Últimos 30 dias', days: 30 }].map(p => (
          <div
            key={p.days}
            onClick={() => goPreset(p.days)}
            style={{ padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid transparent' }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B7DD8', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#CBD5E1', margin: 0, flex: 1 }}>{p.label}</p>
            <ChevronRight size={14} color="#334155" />
          </div>
        ))}

        {/* Histórico por dia */}
        {days.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '12px 20px' }} />
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 20px 8px' }}>
              Histórico diário
            </p>
            {grouped.map(g => (
              <div key={g.month}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'capitalize', margin: '8px 20px 4px' }}>
                  {g.month}
                </p>
                {g.entries.map(d => {
                  const today = new Date();
                  const brt = new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0];
                  const isToday = d.date === brt;
                  return (
                    <div
                      key={d.date}
                      onClick={() => { goPreset(1, Math.round((new Date(brt + 'T00:00:00Z').getTime() - new Date(d.date + 'T00:00:00Z').getTime()) / 86400000)); }}
                      style={{ padding: '9px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid transparent' }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isToday ? '#34D399' : '#334155', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', fontWeight: isToday ? 600 : 400, color: isToday ? '#E2E8F0' : '#94A3B8', margin: 0 }}>
                        {fmtDayShort(d.date)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {days.length === 0 && (
          <p style={{ fontSize: '12px', color: '#475569', margin: '16px 20px 0', lineHeight: 1.6 }}>
            O histórico diário será preenchido após configurar o Make.com para rodar todo dia à meia-noite.
          </p>
        )}
      </div>
    </div>
  );

  const exportPanel = (
    <div className="sidebar-panel" style={{ width: '240px' }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Exportar</p>
        <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
          Período: {data.week}
        </p>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => { setPanel(null); setTimeout(() => window.print(), 150); }}
          style={{
            width: '100%', padding: '14px 16px', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3B7DD8, #6EA8F0)',
            color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 4px 14px rgba(59,125,216,0.35)',
          }}
        >
          <FileText size={16} />
          Exportar PDF
        </button>
        <button
          onClick={() => { downloadCSV(data); setPanel(null); }}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(59,125,216,0.10)', border: '1px solid rgba(59,125,216,0.25)',
            color: '#60A5FA', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}
        >
          <Download size={16} />
          Exportar CSV
        </button>
        <p style={{ fontSize: '11px', color: '#475569', margin: '6px 0 0', lineHeight: 1.6 }}>
          <strong style={{ color: '#64748B' }}>PDF</strong> — captura o visual do dashboard.<br />
          <strong style={{ color: '#64748B' }}>CSV</strong> — dados em formato planilha.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside id="sidebar" style={{
        position: 'fixed', left: 0, top: 0, width: '72px', height: '100vh', zIndex: 40,
        background: 'rgba(7, 9, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0', gap: '6px',
        boxShadow: '2px 0 24px rgba(0,0,0,0.35)',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <Image src="/logo1.png" alt="LiberPay" width={44} height={44} className="object-contain" />
        </div>
        <NavIcon icon={<LayoutDashboard size={20} />} active={panel === null} onClick={() => setPanel(null)} />
        <NavIcon icon={<Calendar size={20} />} active={panel === 'days'} onClick={() => toggle('days')} />
        <NavIcon icon={<Download size={20} />} active={panel === 'export'} onClick={() => toggle('export')} />
      </aside>

      <nav className="mobile-nav">
        <NavIcon icon={<LayoutDashboard size={22} />} active={panel === null} onClick={() => setPanel(null)} />
        <NavIcon icon={<Calendar size={22} />} active={panel === 'days'} onClick={() => toggle('days')} />
        <NavIcon icon={<Download size={22} />} active={panel === 'export'} onClick={() => toggle('export')} />
      </nav>

      {panel === 'days' && daysPanel}
      {panel === 'export' && exportPanel}

      {panel !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 38 }} onClick={() => setPanel(null)} />
      )}
    </>
  );
}
