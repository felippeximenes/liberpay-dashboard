'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { Clock } from 'lucide-react';

interface FunnelStep {
  label: string;
  value: number | null;
  color: string;
  isPending?: boolean;
}

function convRate(from: number, to: number | null): string | null {
  if (to === null || from === 0) return null;
  return ((to / from) * 100).toFixed(1) + '%';
}

export default function FunnelChart({ data }: { data: WeeklySnapshot }) {
  const steps: FunnelStep[] = [
    { label: 'Visitantes', value: data.ga4.visitors, color: '#1A56A0' },
    { label: 'Leads gerados', value: data.ga4.leads, color: '#2D7DD2' },
    { label: 'Deals criados', value: data.pipedrive.dealsCreated, color: '#00C9A7' },
    {
      label: 'Conversão LiberPay',
      value: data.conversion.transactions,
      color: '#F6AD55',
      isPending: data.conversion.transactions === null,
    },
  ];

  const maxValue = Math.max(...steps.map((s) => s.value ?? 0));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Funil de Vendas</h2>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const prev = steps[i - 1];
          const rate = prev ? convRate(prev.value ?? 0, step.value) : null;
          const width = step.isPending
            ? 30
            : maxValue > 0
            ? Math.max(((step.value ?? 0) / maxValue) * 100, 8)
            : 8;

          return (
            <div key={step.label}>
              {rate && (
                <div className="flex items-center justify-center my-1">
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {rate} viram {step.label.toLowerCase()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-36 shrink-0 text-right">{step.label}</span>
                <div className="flex-1 relative h-10 bg-gray-50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                    style={{ width: `${width}%`, backgroundColor: step.color }}
                  >
                    {step.isPending ? (
                      <span className="text-xs font-medium text-white flex items-center gap-1 whitespace-nowrap">
                        <Clock size={12} /> Pendente
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(step.value ?? 0).toLocaleString('pt-BR')}
                      </span>
                    )}
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
