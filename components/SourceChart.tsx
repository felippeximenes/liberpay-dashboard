import { WeeklySnapshot } from '@/types/snapshot';
import { BarChart2, Globe, Search, TrendingUp, HelpCircle, Link, CreditCard, Users, Play, Megaphone, Layers } from 'lucide-react';

const CHANNEL_LABELS: Record<string, string> = {
  'Cross-network': 'Multi-canal Pago',
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

const CHANNEL_TOOLTIPS: Record<string, string> = {
  'Cross-network': 'Google Ads distribuído em múltiplos canais ao mesmo tempo (Performance Max, Display, parceiros, mídia programática). É tráfego PAGO — não orgânico.',
  'Direct': 'Visitantes que digitaram a URL diretamente, vieram de favoritos ou cuja origem não pôde ser rastreada.',
  'Organic Search': 'Cliques em resultados orgânicos de buscadores (Google, Bing) — sem custo por clique.',
  'Paid Search': 'Cliques em anúncios de busca paga (Google Ads, Bing Ads).',
  'Paid Social': 'Anúncios pagos em redes sociais (Instagram, Facebook, TikTok etc.).',
  'Paid Other': 'Outros formatos de mídia paga não categorizados acima.',
  'Referral': 'Visitantes vindos de links em outros sites ou plataformas.',
  'Organic Social': 'Posts orgânicos (não patrocinados) em redes sociais.',
  'Unassigned': 'Canal não identificado pelo GA4.',
  'Organic Video': 'Visitas originadas de vídeos orgânicos (YouTube etc.).',
};

const PAID_CHANNELS = new Set(['Cross-network', 'Paid Social', 'Paid Search', 'Paid Other']);

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  'Cross-network': <Layers size={15} />,
  'Direct': <Globe size={15} />,
  'Organic Search': <Search size={15} />,
  'Paid Social': <Megaphone size={15} />,
  'Unassigned': <HelpCircle size={15} />,
  'Referral': <Link size={15} />,
  'Paid Other': <CreditCard size={15} />,
  'Organic Social': <Users size={15} />,
  'Paid Search': <TrendingUp size={15} />,
  'Organic Video': <Play size={15} />,
};

const GRADIENTS = [
  { bar: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)', shadow: 'rgba(59,125,216,0.30)' },
  { bar: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)', shadow: 'rgba(123,111,208,0.30)' },
  { bar: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)', shadow: 'rgba(0,192,160,0.30)' },
  { bar: 'linear-gradient(135deg, #F0883E 0%, #F6B05E 100%)', shadow: 'rgba(240,136,62,0.30)' },
  { bar: 'linear-gradient(135deg, #E03E5A 0%, #F07090 100%)', shadow: 'rgba(224,62,90,0.30)' },
  { bar: 'linear-gradient(135deg, #8B59D0 0%, #B08AE8 100%)', shadow: 'rgba(139,89,208,0.30)' },
];

export default function SourceChart({ data }: { data: WeeklySnapshot }) {
  const sources = Object.entries(data.ga4.bySource).sort(([, a], [, b]) => b - a);
  const total = sources.reduce((sum, [, v]) => sum + v, 0);
  const paidTotal = sources.filter(([s]) => PAID_CHANNELS.has(s)).reduce((sum, [, v]) => sum + v, 0);
  const paidPct = total > 0 ? (paidTotal / total) * 100 : 0;

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: 0, letterSpacing: '-0.2px' }}>
          Origem dos Visitantes
        </h2>
        {total > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B7DD8', background: 'rgba(59,125,216,0.08)', border: '1px solid rgba(59,125,216,0.18)', padding: '3px 8px', borderRadius: '20px' }}>
            {paidPct.toFixed(0)}% pago
          </span>
        )}
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sources.map(([source, value], i) => {
            const pct = total > 0 ? (value / total) * 100 : 0;
            const style = GRADIENTS[i % GRADIENTS.length];
            const label = CHANNEL_LABELS[source] ?? source;
            const icon = CHANNEL_ICONS[source] ?? <Globe size={15} />;

            const tooltip = CHANNEL_TOOLTIPS[source];
            const isPaid = PAID_CHANNELS.has(source);

            return (
              <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '10px' }} title={tooltip}>

                {/* Gradient bar */}
                <div style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(237,241,251,0.80)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.max(pct, 3)}%`,
                    borderRadius: '12px',
                    background: style.bar,
                    boxShadow: `0 4px 14px ${style.shadow}`,
                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Shimmer */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)',
                    }} />
                  </div>
                </div>

                {/* Label card */}
                <div style={{
                  width: '128px',
                  height: '48px',
                  flexShrink: 0,
                  borderRadius: '14px',
                  background: style.bar,
                  boxShadow: `0 6px 18px ${style.shadow}`,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '0 10px',
                  overflow: 'hidden',
                }}>
                  {/* Icon badge */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    {icon}
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <p style={{
                        fontSize: '8px', fontWeight: 700, margin: 0,
                        color: 'rgba(255,255,255,0.75)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </p>
                      {isPaid && (
                        <span style={{ fontSize: '6px', fontWeight: 800, color: 'rgba(255,255,255,0.90)', background: 'rgba(255,255,255,0.20)', borderRadius: '4px', padding: '1px 3px', flexShrink: 0, letterSpacing: '0.04em' }}>
                          PAGO
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '13px', fontWeight: 700, margin: '1px 0 0',
                      color: 'white', letterSpacing: '-0.3px', lineHeight: 1,
                    }}>
                      {value.toLocaleString('pt-BR')}
                    </p>
                    <p style={{
                      fontSize: '9px', margin: '1px 0 0',
                      color: 'rgba(255,255,255,0.60)',
                    }}>
                      {pct.toFixed(1)}%
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
