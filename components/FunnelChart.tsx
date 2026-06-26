'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Users, TrendingUp, Zap, Award } from 'lucide-react';

interface FunnelStep {
  label: string;
  sublabel: string;
  value: number | null;
  gradient: string;
  shadow: string;
  icon: React.ReactNode;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function convRate(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return (to / from) * 100;
}

function fmtRate(r: number): string {
  return r < 1 ? `${r.toFixed(2)}%` : `${r.toFixed(1)}%`;
}

const SHRINK = 10;

function FunnelSection({
  title,
  subtitle,
  accentColor,
  steps,
  targetConv,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  steps: FunnelStep[];
  targetConv?: number;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: accentColor, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{title}</p>
          <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0 0' }}>{subtitle}</p>
        </div>
      </div>

      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1] : null;
        const rate = prev ? convRate(prev.value, step.value) : null;
        const rateColor = rate === null
          ? '#94A3B8'
          : targetConv
            ? rate >= targetConv ? '#34D399' : rate >= targetConv * 0.5 ? '#FCD34D' : '#F87171'
            : '#94A3B8';

        const sideMargin = `${i * SHRINK}%`;

        return (
          <div key={step.label}>
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0', paddingLeft: sideMargin, paddingRight: sideMargin }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: rateColor,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${rateColor}44`,
                  padding: '2px 10px', borderRadius: '20px', margin: '0 8px', whiteSpace: 'nowrap',
                }}>
                  {rate !== null
                    ? `↓ ${fmtRate(rate)}${targetConv ? `  ·  meta ${targetConv}%` : ''}`
                    : '↓ —'}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}

            <div style={{
              marginLeft: sideMargin, marginRight: sideMargin,
              minHeight: '70px', borderRadius: '14px',
              background: step.gradient,
              boxShadow: `0 6px 22px ${step.shadow}`,
              display: 'flex', alignItems: 'center',
              padding: '12px 18px', gap: '12px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 70%)' }} />
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}>
                {step.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, margin: 0, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {step.label}
                </p>
                <p style={{ fontSize: '21px', fontWeight: 800, margin: '2px 0 0', color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {step.value !== null ? step.value.toLocaleString('pt-BR') : '—'}
                </p>
                <p style={{ fontSize: '10px', margin: '3px 0 0', color: 'rgba(255,255,255,0.62)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {step.sublabel}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const marketingSteps: FunnelStep[] = [
    {
      label: 'Sessões',
      sublabel: `${data.ga4.newUsers.toLocaleString('pt-BR')} novos · GA4`,
      value: data.ga4.visitors,
      gradient: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)',
      shadow: 'rgba(59,125,216,0.40)',
      icon: <Users size={16} />,
    },
    {
      label: 'Leads Criados',
      sublabel: 'caixa de entrada · Pipedrive',
      value: data.pipedrive.leadsCreated,
      gradient: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)',
      shadow: 'rgba(123,111,208,0.40)',
      icon: <TrendingUp size={16} />,
    },
  ];

  const salesSteps: FunnelStep[] = [
    {
      label: 'Deals Criados',
      sublabel: 'negócios abertos · Pipedrive',
      value: data.pipedrive.dealsCreated,
      gradient: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)',
      shadow: 'rgba(0,192,160,0.40)',
      icon: <Zap size={16} />,
    },
    {
      label: 'Deals Ganhos',
      sublabel: data.pipedrive.totalValue > 0
        ? `${formatCurrency(data.pipedrive.totalValue)} · Pipedrive`
        : 'negócios fechados · Pipedrive',
      value: data.pipedrive.dealsWon,
      gradient: 'linear-gradient(135deg, #0EA968 0%, #34D399 100%)',
      shadow: 'rgba(14,169,104,0.40)',
      icon: <Award size={16} />,
    },
  ];

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <FunnelSection
        title="Funil de Marketing"
        subtitle="Sessões GA4 → Leads Pipedrive"
        accentColor="#3B7DD8"
        steps={marketingSteps}
      />

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      <FunnelSection
        title="Funil de Vendas"
        subtitle="Deals Criados → Deals Ganhos · Pipedrive"
        accentColor="#00C0A0"
        steps={salesSteps}
        targetConv={20}
      />
    </div>
  );
}
