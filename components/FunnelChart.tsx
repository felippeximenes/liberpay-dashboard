'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Clock } from 'lucide-react';

function convRate(from: number, to: number | null): string | null {
  if (to === null || from === 0) return null;
  return ((to / from) * 100).toFixed(1) + '%';
}

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const steps = [
    { label: 'Visitantes', value: data.ga4.visitors, color: '#1A56A0', bgLight: '#EBF2FF' },
    { label: 'Leads gerados', value: data.ga4.leads, color: '#2D7DD2', bgLight: '#E8F4FF' },
    { label: 'Deals criados', value: data.pipedrive.dealsCreated, color: '#00C9A7', bgLight: '#E6FAF7' },
    {
      label: 'Conversão LiberPay',
      value: data.conversion.transactions,
      color: '#F6AD55',
      bgLight: '#FFF8EC',
      isPending: data.conversion.transactions === null,
    },
  ];

  const visualWidths = [100, 78, 56, 34];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Funil de Vendas</h2>
      <div className="flex flex-col items-center gap-0">
        {steps.map((step, i) => {
          const prev = steps[i - 1];
          const rate = prev ? convRate(prev.value ?? 0, step.value) : null;
          const w = visualWidths[i];
          const nextW = visualWidths[i + 1] ?? w - 22;
          const leftPct = ((w - nextW) / 2 / w) * 100;
          const rightPct = 100 - leftPct;
          const clipPath = i < steps.length - 1
            ? `polygon(0% 0%, 100% 0%, ${rightPct}% 100%, ${leftPct}% 100%)`
            : `polygon(${leftPct}% 0%, ${rightPct}% 0%, ${rightPct}% 100%, ${leftPct}% 100%)`;

          return (
            <div key={step.label} className="w-full">
              {rate && (
                <div className="flex justify-center py-1.5">
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-0.5 rounded-full border border-gray-100">
                    ↓ {rate} avançaram
                  </span>
                </div>
              )}
              <div className="flex justify-center">
                <div
                  className="flex items-center justify-between px-5 transition-all duration-500"
                  style={{
                    width: `${w}%`,
                    height: '52px',
                    backgroundColor: step.color,
                    clipPath,
                  }}
                >
                  <span className="text-sm font-medium text-white drop-shadow-sm truncate">
                    {step.label}
                  </span>
                  {step.isPending ? (
                    <span className="text-xs font-medium text-white flex items-center gap-1 ml-2 shrink-0 opacity-90">
                      <Clock size={12} /> Pendente
                    </span>
                  ) : (
                    <span className="text-base font-bold text-white ml-2 shrink-0 drop-shadow-sm">
                      {(step.value ?? 0).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
