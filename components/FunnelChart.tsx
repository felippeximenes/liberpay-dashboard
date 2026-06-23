'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Users, TrendingUp, Zap, Award } from 'lucide-react';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface FunnelStep {
  label: string;
  sublabel: string;
  value: number | null;
  gradient: string;
  shadow: string;
  icon: React.ReactNode;
}

function convRate(from: number, to: number | null): number | null {
  if (to === null || from === 0) return null;
  return (to / from) * 100;
}

const CONV_TARGETS: Record<number, { pct: number }> = {
  1: { pct: 3  },
  2: { pct: 30 },
  3: { pct: 20 },
};

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const steps: FunnelStep[] = [
    {
      label: 'Sessões',
      sublabel: `${data.ga4.newUsers.toLocaleString('pt-BR')} novos · GA4`,
      value: data.ga4.visitors,
      gradient: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)',
      shadow: 'rgba(59,125,216,0.40)',
      icon: <Users size={17} />,
    },
    {
      label: 'Leads Gerados',
      sublabel: 'evento lead_created · GA4',
      value: data.ga4.leads,
      gradient: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)',
      shadow: 'rgba(123,111,208,0.40)',
      icon: <TrendingUp size={17} />,
    },
    {
      label: 'Deals Criados',
      sublabel: 'negócios abertos · Pipedrive',
      value: data.pipedrive.dealsCreated,
      gradient: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)',
      shadow: 'rgba(0,192,160,0.40)',
      icon: <Zap size={17} />,
    },
    {
      label: 'Deals Ganhos',
      sublabel: data.pipedrive.totalValue > 0
        ? `${formatCurrency(data.pipedrive.totalValue)} · Pipedrive`
        : 'negócios fechados · Pipedrive',
      value: data.pipedrive.dealsWon,
      gradient: 'linear-gradient(135deg, #0EA968 0%, #34D399 100%)',
      shadow: 'rgba(14,169,104,0.40)',
      icon: <Award size={17} />,
    },
  ];

  // Each step narrows by STEP_SHRINK% on each side → true centered funnel
  const STEP_SHRINK = 7;

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 2px', letterSpacing: '-0.2px' }}>
          Funil de Vendas
        </h2>
        <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>Quantas pessoas chegaram até a compra?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => {
          const prev = i > 0 ? steps[i - 1] : null;
          const prevVal = prev?.value ?? 0;
          const currVal = step.value ?? 0;
          const isInverted = prev !== null && prevVal > 0 && currVal > prevVal;
          const rateNum = prev && !isInverted ? convRate(prevVal, step.value) : null;
          const target = CONV_TARGETS[i];
          const rateColor = rateNum === null || !target
            ? '#94A3B8'
            : rateNum >= target.pct ? '#34D399'
            : rateNum >= target.pct * 0.5 ? '#FCD34D'
            : '#F87171';

          const sideMargin = `${i * STEP_SHRINK}%`;

          return (
            <div key={step.label}>

              {/* ── Conversion badge between steps ── */}
              {i > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  margin: '6px 0',
                  paddingLeft: sideMargin, paddingRight: sideMargin,
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: isInverted ? '#F0883E' : rateColor,
                    background: isInverted ? 'rgba(240,136,62,0.10)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isInverted ? 'rgba(240,136,62,0.35)' : rateColor + '44'}`,
                    padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
                    margin: '0 10px',
                  }}
                    title={isInverted
                      ? 'GA4 e Pipedrive usam definições distintas de lead/deal'
                      : target ? `Meta: ${target.pct}%` : undefined}
                  >
                    {isInverted
                      ? '⚠ fontes distintas'
                      : rateNum !== null
                        ? `↓ ${rateNum.toFixed(1)}%${target ? `  ·  meta ${target.pct}%` : ''}`
                        : '↓'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>
              )}

              {/* ── Funnel bar — symmetric narrowing, all text inside ── */}
              <div style={{
                marginLeft: sideMargin,
                marginRight: sideMargin,
                minHeight: '80px',
                borderRadius: '16px',
                background: step.gradient,
                boxShadow: `0 8px 28px ${step.shadow}`,
                display: 'flex',
                alignItems: 'center',
                padding: '14px 20px',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* shimmer */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 70%)',
                }} />

                {/* icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', position: 'relative',
                }}>
                  {step.icon}
                </div>

                {/* label + number + sublabel stacked vertically — no right overflow */}
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <p style={{
                    fontSize: '10px', fontWeight: 700, margin: 0,
                    color: 'rgba(255,255,255,0.75)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {step.label}
                  </p>
                  <p style={{
                    fontSize: '22px', fontWeight: 800, margin: '2px 0 0',
                    color: 'white', letterSpacing: '-0.5px', lineHeight: 1,
                  }}>
                    {(step.value ?? 0).toLocaleString('pt-BR')}
                  </p>
                  <p style={{
                    fontSize: '10px', margin: '3px 0 0',
                    color: 'rgba(255,255,255,0.62)', lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {step.sublabel}
                  </p>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
