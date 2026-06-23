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

const CHANNEL_DESC: Record<string, string> = {
  'Cross-network': 'Google Ads em múltiplos canais (Performance Max, Display…)',
  'Direct': 'URL digitada diretamente ou favoritos',
  'Organic Search': 'Resultados orgânicos do Google/Bing — sem custo',
  'Paid Social': 'Anúncios pagos no Instagram, Facebook, TikTok…',
  'Unassigned': 'Origem não rastreada pelo GA4',
  'Referral': 'Links em outros sites apontando para o Liberpay',
  'Paid Other': 'Outros formatos de mídia paga',
  'Paid Search': 'Anúncios pagos em buscadores (Google Ads…)',
  'Organic Social': 'Posts orgânicos (não patrocinados) em redes sociais',
  'Organic Video': 'Vídeos orgânicos no YouTube e similares',
};

const PAID_CHANNELS   = new Set(['Cross-network', 'Paid Social', 'Paid Search', 'Paid Other']);
const ORGANIC_CHANNELS = new Set(['Organic Search', 'Organic Social', 'Organic Video']);

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  'Cross-network': <Layers size={14} />,
  'Direct': <Globe size={14} />,
  'Organic Search': <Search size={14} />,
  'Paid Social': <Megaphone size={14} />,
  'Unassigned': <HelpCircle size={14} />,
  'Referral': <Link size={14} />,
  'Paid Other': <CreditCard size={14} />,
  'Organic Social': <Users size={14} />,
  'Paid Search': <TrendingUp size={14} />,
  'Organic Video': <Play size={14} />,
};

const PAID_GRADIENTS = [
  { bar: 'linear-gradient(135deg, #3B7DD8 0%, #6EA8F0 100%)', shadow: 'rgba(59,125,216,0.28)' },
  { bar: 'linear-gradient(135deg, #7B6FD0 0%, #A99FE8 100%)', shadow: 'rgba(123,111,208,0.28)' },
  { bar: 'linear-gradient(135deg, #5B8FE8 0%, #8BBCFF 100%)', shadow: 'rgba(91,143,232,0.28)' },
  { bar: 'linear-gradient(135deg, #2D6BB8 0%, #5B99E0 100%)', shadow: 'rgba(45,107,184,0.28)' },
];
const ORGANIC_GRADIENTS = [
  { bar: 'linear-gradient(135deg, #00C0A0 0%, #00DDB8 100%)', shadow: 'rgba(0,192,160,0.28)' },
  { bar: 'linear-gradient(135deg, #14A87A 0%, #2DCFA0 100%)', shadow: 'rgba(20,168,122,0.28)' },
  { bar: 'linear-gradient(135deg, #009970 0%, #00BB90 100%)', shadow: 'rgba(0,153,112,0.28)' },
];
const OTHER_GRADIENTS = [
  { bar: 'linear-gradient(135deg, #8892A6 0%, #A8B4C8 100%)', shadow: 'rgba(136,146,166,0.28)' },
  { bar: 'linear-gradient(135deg, #6E7A90 0%, #94A0B4 100%)', shadow: 'rgba(110,122,144,0.28)' },
  { bar: 'linear-gradient(135deg, #B0BCCE 0%, #C8D3E2 100%)', shadow: 'rgba(176,188,206,0.20)' },
];

function SectionHeader({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 6px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.10)' }} />
      <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, padding: '1px 7px', borderRadius: '20px' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function ChannelRow({ source, value, pct, gradient, isPaid }: {
  source: string; value: number; pct: number;
  gradient: { bar: string; shadow: string }; isPaid: boolean;
}) {
  const label = CHANNEL_LABELS[source] ?? source;
  const icon  = CHANNEL_ICONS[source]  ?? <Globe size={14} />;
  const desc  = CHANNEL_DESC[source];

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '10px' }}>
      {/* Bar */}
      <div style={{ flex: 1, minHeight: '68px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${Math.max(pct, 2)}%`, borderRadius: '12px',
          background: gradient.bar, boxShadow: `0 4px 14px ${gradient.shadow}`,
          transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)' }} />
        </div>
      </div>

      {/* Label card */}
      <div style={{
        width: '178px', flexShrink: 0, borderRadius: '14px',
        background: gradient.bar, boxShadow: `0 6px 18px ${gradient.shadow}`,
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
      }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Name + PAGO badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, margin: 0, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </p>
            {isPaid && (
              <span style={{ fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.22)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0 }}>
                PAGO
              </span>
            )}
          </div>
          {/* Value + pct */}
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.4px', lineHeight: 1 }}>
            {value.toLocaleString('pt-BR')}{' '}
            <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.72 }}>{pct.toFixed(1)}%</span>
          </p>
          {/* Description — wraps naturally */}
          {desc && (
            <p style={{ fontSize: '9px', margin: '3px 0 0', color: 'rgba(255,255,255,0.68)', lineHeight: 1.4 }}>
              {desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SourceChart({ data }: { data: WeeklySnapshot }) {
  const allEntries = Object.entries(data.ga4.bySource).sort(([, a], [, b]) => b - a);
  const total = allEntries.reduce((sum, [, v]) => sum + v, 0);

  const paidEntries    = allEntries.filter(([k]) => PAID_CHANNELS.has(k));
  const organicEntries = allEntries.filter(([k]) => ORGANIC_CHANNELS.has(k));
  const otherEntries   = allEntries.filter(([k]) => !PAID_CHANNELS.has(k) && !ORGANIC_CHANNELS.has(k));

  const paidTotal    = paidEntries.reduce((s, [, v]) => s + v, 0);
  const organicTotal = organicEntries.reduce((s, [, v]) => s + v, 0);
  const otherTotal   = otherEntries.reduce((s, [, v]) => s + v, 0);

  const pct = (v: number) => total > 0 ? (v / total) * 100 : 0;

  return (
    <div className="glass" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 2px', letterSpacing: '-0.2px' }}>
          Origem dos Visitantes
        </h2>
        <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>De onde veio quem visitou o site esta semana?</p>
      </div>

      {allEntries.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,125,216,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={22} color="#3B7DD8" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', margin: 0 }}>Dados disponíveis em breve</p>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, textAlign: 'center', maxWidth: '200px' }}>
            Serão preenchidos na próxima execução da automação
          </p>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          {total > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', background: 'rgba(59,125,216,0.15)', border: '1px solid rgba(59,125,216,0.30)', padding: '4px 10px', borderRadius: '20px' }}>
                Pago {pct(paidTotal).toFixed(0)}%
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', background: 'rgba(0,192,160,0.15)', border: '1px solid rgba(0,192,160,0.30)', padding: '4px 10px', borderRadius: '20px' }}>
                Orgânico {pct(organicTotal).toFixed(0)}%
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.22)', padding: '4px 10px', borderRadius: '20px' }}>
                Direto/Outros {pct(otherTotal).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Stacked bar */}
          {total > 0 && (
            <div style={{ display: 'flex', height: '6px', borderRadius: '6px', overflow: 'hidden', marginBottom: '4px', gap: '2px' }}>
              <div style={{ width: `${pct(paidTotal)}%`, background: 'linear-gradient(90deg, #3B7DD8, #6EA8F0)', borderRadius: '6px 0 0 6px', transition: 'width 0.6s ease' }} />
              <div style={{ width: `${pct(organicTotal)}%`, background: 'linear-gradient(90deg, #00C0A0, #00DDB8)', transition: 'width 0.6s ease' }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '0 6px 6px 0' }} />
            </div>
          )}

          {/* Paid group */}
          {paidEntries.length > 0 && (
            <>
              <SectionHeader label="Mídia Paga" pct={pct(paidTotal)} color="#3B7DD8" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {paidEntries.map(([source, value], i) => (
                  <ChannelRow key={source} source={source} value={value} pct={pct(value)} gradient={PAID_GRADIENTS[i % PAID_GRADIENTS.length]} isPaid={true} />
                ))}
              </div>
            </>
          )}

          {/* Organic group */}
          {organicEntries.length > 0 && (
            <>
              <SectionHeader label="Orgânico" pct={pct(organicTotal)} color="#00966A" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {organicEntries.map(([source, value], i) => (
                  <ChannelRow key={source} source={source} value={value} pct={pct(value)} gradient={ORGANIC_GRADIENTS[i % ORGANIC_GRADIENTS.length]} isPaid={false} />
                ))}
              </div>
            </>
          )}

          {/* Other group */}
          {otherEntries.length > 0 && (
            <>
              <SectionHeader label="Direto & Outros" pct={pct(otherTotal)} color="#6E7A90" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {otherEntries.map(([source, value], i) => (
                  <ChannelRow key={source} source={source} value={value} pct={pct(value)} gradient={OTHER_GRADIENTS[i % OTHER_GRADIENTS.length]} isPaid={false} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
