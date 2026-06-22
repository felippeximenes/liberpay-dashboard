'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Calendar, Download, FileText, ChevronRight } from 'lucide-react';
import { WeeklySnapshot } from '@/types/snapshot';

export interface WeekEntry {
  key: string;
  url: string;
}

interface SidebarProps {
  weeks: WeekEntry[];
  currentWeek?: string;
  data: WeeklySnapshot;
}

function formatWeekKey(key: string): string {
  const date = new Date(key + 'T00:00:00Z');
  if (isNaN(date.getTime())) return key;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function downloadCSV(data: WeeklySnapshot) {
  const rows = [
    ['Métrica', 'Valor', 'Semana'],
    ['Visitantes', data.ga4.visitors, data.week],
    ['Novos Usuários', data.ga4.newUsers, data.week],
    ['Leads (Eventos)', data.ga4.leads, data.week],
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
  a.download = `liberpay-funil-${data.week.replace('/', '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Panel = 'weeks' | 'export' | null;

function NavIcon({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
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

export default function Sidebar({ weeks, currentWeek, data }: SidebarProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const router = useRouter();

  const toggle = (p: Exclude<Panel, null>) => setPanel((prev) => (prev === p ? null : p));
  const selectWeek = (key: string | null) => {
    router.push(key ? `?week=${key}` : '/');
    setPanel(null);
  };

  const weeksPanel = (
    <div className="sidebar-panel" style={{ width: '260px' }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Histórico</p>
        <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
          {weeks.length > 0 ? `${weeks.length} semana${weeks.length > 1 ? 's' : ''} salva${weeks.length > 1 ? 's' : ''}` : 'Nenhum histórico ainda'}
        </p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <div
          onClick={() => selectWeek(null)}
          style={{
            padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            background: !currentWeek ? 'rgba(59,125,216,0.12)' : 'transparent',
            borderLeft: !currentWeek ? '3px solid #3B7DD8' : '3px solid transparent',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', margin: 0 }}>Semana Atual</p>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>Mais recente</p>
          </div>
          {!currentWeek && <ChevronRight size={14} color="#3B7DD8" />}
        </div>

        {weeks.length === 0 && (
          <p style={{ fontSize: '12px', color: '#475569', margin: '20px 20px 0', lineHeight: 1.6 }}>
            O histórico será preenchido a cada execução do Make.com nas próximas sextas-feiras.
          </p>
        )}

        {weeks.map((w) => (
          <div
            key={w.key}
            onClick={() => selectWeek(w.key)}
            style={{
              padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
              background: currentWeek === w.key ? 'rgba(59,125,216,0.12)' : 'transparent',
              borderLeft: currentWeek === w.key ? '3px solid #3B7DD8' : '3px solid transparent',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#334155', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#CBD5E1', margin: 0, flex: 1 }}>
              {formatWeekKey(w.key)}
            </p>
            {currentWeek === w.key && <ChevronRight size={14} color="#3B7DD8" />}
          </div>
        ))}
      </div>
    </div>
  );

  const exportPanel = (
    <div className="sidebar-panel" style={{ width: '240px' }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Exportar</p>
        <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
          Semana: {data.week !== 'semana-atual' ? data.week : 'atual'}
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
      {/* ── Desktop sidebar ── */}
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
        <NavIcon icon={<Calendar size={20} />} active={panel === 'weeks'} onClick={() => toggle('weeks')} />
        <NavIcon icon={<Download size={20} />} active={panel === 'export'} onClick={() => toggle('export')} />
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        <NavIcon icon={<LayoutDashboard size={22} />} active={panel === null} onClick={() => setPanel(null)} />
        <NavIcon icon={<Calendar size={22} />} active={panel === 'weeks'} onClick={() => toggle('weeks')} />
        <NavIcon icon={<Download size={22} />} active={panel === 'export'} onClick={() => toggle('export')} />
      </nav>

      {/* ── Panels ── */}
      {panel === 'weeks' && weeksPanel}
      {panel === 'export' && exportPanel}

      {/* ── Backdrop ── */}
      {panel !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 38 }} onClick={() => setPanel(null)} />
      )}
    </>
  );
}
