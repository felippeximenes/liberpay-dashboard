import { WeeklySnapshot } from '@/types/snapshot';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Zap, Globe, Target } from 'lucide-react';

type Level = 'success' | 'warning' | 'danger' | 'info';

interface Insight {
  title: string;
  body: string;
  level: Level;
  icon: React.ReactNode;
  metric?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  'Direct': 'Acesso Direto',
  'Organic Search': 'Busca Orgânica',
  'Paid Social': 'Social Pago',
  'Unassigned': 'Não Identificado',
  'Referral': 'Indicação',
  'Paid Other': 'Outro Pago',
  'Organic Social': 'Social Orgânico',
  'Paid Search': 'Busca Paga',
  'Organic Video': 'Vídeo Orgânico',
};

const STYLES: Record<Level, { border: string; bg: string; iconBg: string; iconColor: string; titleColor: string }> = {
  success: { border: '#00C0A0', bg: 'rgba(0,192,160,0.08)',  iconBg: 'rgba(0,192,160,0.16)',  iconColor: '#34D399', titleColor: '#34D399' },
  warning: { border: '#F0883E', bg: 'rgba(240,136,62,0.08)', iconBg: 'rgba(240,136,62,0.16)', iconColor: '#FB923C', titleColor: '#FB923C' },
  danger:  { border: '#E03E5A', bg: 'rgba(224,62,90,0.08)',  iconBg: 'rgba(224,62,90,0.16)',  iconColor: '#F87171', titleColor: '#F87171' },
  info:    { border: '#3B7DD8', bg: 'rgba(59,125,216,0.08)', iconBg: 'rgba(59,125,216,0.16)', iconColor: '#60A5FA', titleColor: '#60A5FA' },
};

function buildInsights(data: WeeklySnapshot): Insight[] {
  const insights: Insight[] = [];
  const bySource = data.ga4.bySource ?? {};
  const hasBySource = Object.keys(bySource).length > 0;
  const total = data.ga4.visitors;

  // 1 — Conversão Lead → Deal
  const convRate = data.ga4.leads > 0
    ? (data.pipedrive.dealsCreated / data.ga4.leads) * 100
    : null;

  if (convRate === null) {
    insights.push({ title: 'Sem leads registrados', body: 'Nenhum evento de lead captado pelo GA4 nesta semana.', level: 'warning', icon: <Target size={15} />, metric: '—' });
  } else if (convRate > 100) {
    insights.push({ title: 'Leads vs Deals: fontes diferentes', body: `GA4 registrou ${data.ga4.leads} leads e o Pipedrive tem ${data.pipedrive.dealsCreated} deals criados — são contagens de sistemas distintos e não formam uma taxa de conversão direta.`, level: 'info', icon: <Info size={15} />, metric: '—' });
  } else if (convRate < 1) {
    insights.push({ title: 'Conversão crítica', body: `${convRate.toFixed(2)}% dos leads viraram deals — muito abaixo da meta de 5%.`, level: 'danger', icon: <AlertTriangle size={15} />, metric: `${convRate.toFixed(2)}%` });
  } else if (convRate < 5) {
    insights.push({ title: 'Conversão abaixo da meta', body: `${convRate.toFixed(1)}% dos leads viraram deals — meta recomendada: 5%+.`, level: 'warning', icon: <TrendingDown size={15} />, metric: `${convRate.toFixed(1)}%` });
  } else {
    insights.push({ title: 'Conversão dentro da meta', body: `${convRate.toFixed(1)}% dos leads viraram deals no Pipedrive.`, level: 'success', icon: <CheckCircle size={15} />, metric: `${convRate.toFixed(1)}%` });
  }

  // 2 — Mídia paga (Cross-network = Google multi-canal = pago)
  if (hasBySource && total > 0) {
    const paidVisits = (bySource['Cross-network'] ?? 0) + (bySource['Paid Social'] ?? 0) + (bySource['Paid Search'] ?? 0) + (bySource['Paid Other'] ?? 0);
    const paidPct = (paidVisits / total) * 100;
    if (paidVisits === 0) {
      insights.push({ title: 'Mídia paga sem visitas', body: 'Nenhuma sessão registrada de canais pagos nesta semana.', level: 'warning', icon: <Zap size={15} />, metric: '0%' });
    } else {
      insights.push({ title: 'Mídia paga', body: `${paidPct.toFixed(1)}% das visitas vieram de canais pagos — ${paidVisits.toLocaleString('pt-BR')} sessões.`, level: 'info', icon: <Zap size={15} />, metric: `${paidPct.toFixed(1)}%` });
    }
  }

  // 3 — Canal principal
  if (hasBySource && total > 0) {
    const [topKey, topVal] = Object.entries(bySource).sort(([, a], [, b]) => b - a)[0];
    const pct = ((topVal / total) * 100).toFixed(1);
    const label = CHANNEL_LABELS[topKey] ?? topKey;
    insights.push({ title: 'Principal canal', body: `${label} lidera com ${pct}% das visitas (${topVal.toLocaleString('pt-BR')} sessões).`, level: 'info', icon: <Globe size={15} />, metric: `${pct}%` });
  }

  // 4 — Comparativo semana anterior
  if (data.previousWeek) {
    const prev = data.previousWeek.ga4.visitors;
    const curr = data.ga4.visitors;
    if (prev > 0) {
      const change = ((curr - prev) / prev) * 100;
      const up = change >= 0;
      insights.push({
        title: up ? 'Visitas em alta' : 'Queda nas visitas',
        body: `${up ? '+' : ''}${change.toFixed(1)}% de visitantes vs semana anterior (${prev.toLocaleString('pt-BR')} → ${curr.toLocaleString('pt-BR')}).`,
        level: up ? 'success' : 'warning',
        icon: up ? <TrendingUp size={15} /> : <TrendingDown size={15} />,
        metric: `${up ? '+' : ''}${change.toFixed(1)}%`,
      });
    }
  } else {
    insights.push({ title: 'Sem comparativo ainda', body: 'Dados da semana anterior indisponíveis. O comparativo estará disponível a partir da próxima execução.', level: 'info', icon: <Info size={15} /> });
  }

  return insights;
}

export default function InsightCards({ data }: { data: WeeklySnapshot }) {
  const insights = buildInsights(data);

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Insights da Semana
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        {insights.map((insight, i) => {
          const s = STYLES[insight.level];
          return (
            <div key={i} className="glass" style={{ padding: '14px 16px', borderLeft: `3px solid ${s.border}`, background: s.bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor }}>
                  {insight.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: s.titleColor, margin: 0 }}>
                      {insight.title}
                    </p>
                    {insight.metric && (
                      <span style={{ fontSize: '13px', fontWeight: 800, color: s.border, flexShrink: 0 }}>
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                    {insight.body}
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
