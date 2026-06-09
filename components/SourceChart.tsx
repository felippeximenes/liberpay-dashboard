'use client';

import { WeeklySnapshot } from '@/types/snapshot';
import { BarChart2 } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(90deg, #3B7DD8, #6EA8F0)',
  'linear-gradient(90deg, #7B6FD0, #A99FE8)',
  'linear-gradient(90deg, #00C0A0, #00DDB8)',
  'linear-gradient(90deg, #F0883E, #F6B05E)',
  'linear-gradient(90deg, #E03E5A, #F07090)',
  'linear-gradient(90deg, #8B59D0, #B08AE8)',
];

const COLORS = ['#3B7DD8', '#7B6FD0', '#00C0A0', '#F0883E', '#E03E5A', '#8B59D0'];

export default function SourceChart({ data }: { data: WeeklySnapshot }) {
  const sources = Object.entries(data.ga4.bySource).sort(([, a], [, b]) => b - a);
  const total = sources.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 22px', letterSpacing: '-0.2px' }}>
        Origem dos Visitantes
      </h2>

      {sources.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,125,216,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={22} color="#3B7DD8" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8892A6', margin: 0 }}>Dados disponíveis em breve</p>
          <p style={{ fontSize: '12px', color: '#B0BCCE', margin: 0, textAlign: 'center', maxWidth: '200px' }}>
            Serão preenchidos na próxima execução da automação
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sources.map(([source, value], i) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            const barWidth = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#8892A6', width: '90px', flexShrink: 0, textAlign: 'right', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {source}
                </span>
                <div style={{ flex: 1, height: '32px', background: 'rgba(237,241,251,0.80)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '10px',
                    background: GRADIENTS[i % GRADIENTS.length],
                    width: `${barWidth}%`,
                    boxShadow: `0 3px 10px rgba(0,0,0,0.10)`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', width: '72px', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                    {value.toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#B0BCCE' }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
