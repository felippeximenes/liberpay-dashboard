'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Clock, Users, TrendingUp, Zap, DollarSign, Award } from 'lucide-react';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface FunnelStep {
  label: string;
  sublabel: string;
  value: number | null;
  gradient: string;
  shadow: string;
  borderColor: string;
  isPending?: boolean;
  icon: React.ReactNode;
}

function convRate(from: number, to: number | null): string | null {
  if (to === null || from === 0) return null;
  return ((to / from) * 100).toFixed(1) + '%';
}

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const steps: FunnelStep[] = [
    {
      label: 'Visitantes',
      sublabel: `${data.ga4.newUsers.toLocaleString('pt-BR')} novos`,
      value: data.ga4.visitors,
      gradient: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)',
      shadow: 'rgba(59,125,216,0.30)',
      borderColor: 'rgba(59,125,216,0.20)',
      icon: <Users size={15} />,
    },
    {
      label: 'Leads Gerados',
      sublabel: 'eventos GA4',
      value: data.ga4.leads,
      gradient: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)',
      shadow: 'rgba(123,111,208,0.30)',
      borderColor: 'rgba(123,111,208,0.20)',
      icon: <TrendingUp size={15} />,
    },
    {
      label: 'Deals Criados',
      sublabel: 'Pipedrive',
      value: data.pipedrive.dealsCreated,
      gradient: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)',
      shadow: 'rgba(0,192,160,0.30)',
      borderColor: 'rgba(0,192,160,0.20)',
      icon: <Zap size={15} />,
    },
    {
      label: 'Deals Ganhos',
      sublabel: data.pipedrive.totalValue > 0 ? formatCurrency(data.pipedrive.totalValue) : 'Pipedrive',
      value: data.pipedrive.dealsWon,
      gradient: 'linear-gradient(135deg, #0EA968 0%, #34D399 100%)',
      shadow: 'rgba(14,169,104,0.30)',
      borderColor: 'rgba(14,169,104,0.20)',
      icon: <Award size={15} />,
    },
    {
      label: 'Conversão',
      sublabel: 'LiberPay',
      value: data.conversion.transactions,
      gradient: 'linear-gradient(135deg, #F0883E 0%, #F6B05E 100%)',
      shadow: 'rgba(240,136,62,0.30)',
      borderColor: 'rgba(240,136,62,0.20)',
      isPending: data.conversion.transactions === null,
      icon: <DollarSign size={15} />,
    },
  ];

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 20px', letterSpacing: '-0.2px' }}>
        Funil de Vendas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, i) => {
          const prev = i > 0 ? steps[i - 1] : null;
          const rate = prev ? convRate(prev.value ?? 0, step.value) : null;

          return (
            <div key={step.label}>

              {/* ── Conversion badge between levels ── */}
              {rate && (
                <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0', paddingLeft: `calc(${i * 6}% + 4px)` }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(200,211,232,0.50)', marginRight: '8px' }} />
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#8892A6',
                    background: 'rgba(237,241,251,0.90)',
                    border: '1px solid rgba(200,211,232,0.50)',
                    padding: '2px 8px', borderRadius: '20px',
                    whiteSpace: 'nowrap',
                  }}>
                    ↓ {rate}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(200,211,232,0.50)', marginLeft: '8px', maxWidth: '20px' }} />
                </div>
              )}

              {/* ── Funnel row: bar + label card ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                {/* Funnel bar — left margin increases per level for narrowing effect */}
                <div style={{
                  flex: 1,
                  marginLeft: `${i * 6}%`,
                  height: '58px',
                  borderRadius: '12px',
                  background: step.isPending
                    ? 'rgba(237,241,251,0.80)'
                    : step.gradient,
                  boxShadow: step.isPending ? 'none' : `0 6px 20px ${step.shadow}`,
                  border: step.isPending ? `1px dashed rgba(200,211,232,0.80)` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Shimmer overlay */}
                  {!step.isPending && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)',
                      borderRadius: '12px',
                    }} />
                  )}
                  {step.isPending && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#A0ABBF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} /> Pendente
                    </span>
                  )}
                </div>

                {/* Label card */}
                <div style={{
                  width: '128px',
                  height: '58px',
                  flexShrink: 0,
                  borderRadius: '14px',
                  background: step.isPending ? 'rgba(237,241,251,0.70)' : step.gradient,
                  boxShadow: step.isPending ? 'none' : `0 6px 18px ${step.shadow}`,
                  border: step.isPending ? `1px solid ${step.borderColor}` : 'none',
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '0 12px',
                  overflow: 'hidden',
                }}>
                  {/* Icon badge */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                    background: step.isPending ? 'rgba(160,171,191,0.15)' : 'rgba(255,255,255,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.isPending ? '#A0ABBF' : 'white',
                  }}>
                    {step.icon}
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '9px', fontWeight: 700, margin: 0,
                      color: step.isPending ? '#A0ABBF' : 'rgba(255,255,255,0.75)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontSize: '15px', fontWeight: 700, margin: '2px 0 0',
                      color: step.isPending ? '#B0BCCE' : 'white',
                      letterSpacing: '-0.4px', lineHeight: 1,
                    }}>
                      {step.isPending ? '—' : (step.value ?? 0).toLocaleString('pt-BR')}
                    </p>
                    <p style={{
                      fontSize: '9px', margin: '2px 0 0',
                      color: step.isPending ? '#B0BCCE' : 'rgba(255,255,255,0.60)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {step.sublabel}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
