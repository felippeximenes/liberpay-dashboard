'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Clock } from 'lucide-react';

interface FunnelStep {
  label: string;
  value: number | null;
  color: string;
  gradient: string;
  shadow: string;
  isPending?: boolean;
}

function convRate(from: number, to: number | null): string | null {
  if (to === null || from === 0) return null;
  return ((to / from) * 100).toFixed(1) + '%';
}

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const steps: FunnelStep[] = [
    {
      label: 'Visitantes',
      value: data.ga4.visitors,
      color: '#3B7DD8',
      gradient: 'linear-gradient(90deg, #3B7DD8, #6EA8F0)',
      shadow: 'rgba(59,125,216,0.25)',
    },
    {
      label: 'Leads gerados',
      value: data.ga4.leads,
      color: '#7B6FD0',
      gradient: 'linear-gradient(90deg, #7B6FD0, #A99FE8)',
      shadow: 'rgba(123,111,208,0.25)',
    },
    {
      label: 'Deals criados',
      value: data.pipedrive.dealsCreated,
      color: '#00C0A0',
      gradient: 'linear-gradient(90deg, #00C0A0, #00DDB8)',
      shadow: 'rgba(0,192,160,0.25)',
    },
    {
      label: 'Conversão LiberPay',
      value: data.conversion.transactions,
      color: '#F0883E',
      gradient: 'linear-gradient(90deg, #F0883E, #F6B05E)',
      shadow: 'rgba(240,136,62,0.25)',
      isPending: data.conversion.transactions === null,
    },
  ];

  const maxValue = Math.max(...steps.map((s) => s.value ?? 0));

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 22px', letterSpacing: '-0.2px' }}>
        Funil de Vendas
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {steps.map((step, i) => {
          const prev = steps[i - 1];
          const rate = prev ? convRate(prev.value ?? 0, step.value) : null;
          const width = step.isPending
            ? 25
            : maxValue > 0
            ? Math.max(((step.value ?? 0) / maxValue) * 100, 8)
            : 8;

          return (
            <div key={step.label}>
              {rate && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 10px' }}>
                  <span style={{
                    fontSize: '11px', color: '#A0ABBF', fontWeight: 600,
                    background: 'rgba(160,171,191,0.12)', padding: '3px 10px',
                    borderRadius: '20px', letterSpacing: '0.03em',
                  }}>
                    {rate} converteram
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#8892A6', width: '120px', flexShrink: 0, textAlign: 'right', fontWeight: 500 }}>
                  {step.label}
                </span>
                <div style={{ flex: 1, height: '36px', background: 'rgba(237,241,251,0.80)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: '10px',
                    background: step.isPending ? 'rgba(160,171,191,0.25)' : step.gradient,
                    width: `${width}%`,
                    display: 'flex', alignItems: 'center', paddingLeft: '12px',
                    boxShadow: step.isPending ? 'none' : `0 3px 12px ${step.shadow}`,
                    transition: 'width 0.6s ease',
                  }}>
                    {step.isPending && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#A0ABBF', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Clock size={11} /> Pendente
                      </span>
                    )}
                  </div>
                </div>
                {!step.isPending && (
                  <span style={{ fontSize: '14px', fontWeight: 700, width: '56px', flexShrink: 0, color: step.color, letterSpacing: '-0.3px' }}>
                    {(step.value ?? 0).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
