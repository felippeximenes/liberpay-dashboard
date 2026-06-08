'use client';

import { WeeklySnapshot } from '@/types/snapshot';

export default function SourceChart({ data }: { data: WeeklySnapshot }) {
  const sources = Object.entries(data.ga4.bySource)
    .sort(([, a], [, b]) => b - a);

  const total = sources.reduce((sum, [, v]) => sum + v, 0);

  const colors = ['#1A56A0', '#2D7DD2', '#00C9A7', '#F6AD55', '#E53E3E', '#9B59B6'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Origem dos Visitantes</h2>
      <div className="flex flex-col gap-4">
        {sources.map(([source, value], i) => {
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          const barWidth = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={source} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-32 shrink-0 text-right truncate">{source}</span>
              <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: colors[i % colors.length] }}
                />
              </div>
              <div className="flex items-center gap-2 w-24 shrink-0">
                <span className="text-sm font-bold text-gray-800">{value.toLocaleString('pt-BR')}</span>
                <span className="text-xs text-gray-400">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
