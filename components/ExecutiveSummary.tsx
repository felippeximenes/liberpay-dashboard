import { WeeklySnapshot } from '@/types/snapshot';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Status = 'good' | 'warning' | 'bad';

interface Bullet {
  status: Status;
  text: string;
}

const ICON = {
  good:    <CheckCircle  size={14} />,
  warning: <AlertTriangle size={14} />,
  bad:     <XCircle      size={14} />,
};

const COLOR: Record<Status, { text: string; icon: string; bg: string; border: string }> = {
  good:    { text: '#34D399', icon: '#34D399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)'  },
  warning: { text: '#FCD34D', icon: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.18)'  },
  bad:     { text: '#F87171', icon: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' },
};

function pct(a: number, b: number) { return b > 0 ? ((a - b) / b) * 100 : null; }
function fmtPct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`; }

function buildBullets(data: WeeklySnapshot): Bullet[] {
  const bullets: Bullet[] = [];
  const prev = data.previousWeek;

  /* ── 1. Sessões ── */
  const sessDelta = prev ? pct(data.ga4.visitors, prev.ga4.visitors) : null;
  if (sessDelta !== null) {
    if (sessDelta >= 5) {
      bullets.push({ status: 'good', text: `Sessões em alta — ${fmtPct(sessDelta)} vs semana anterior (${data.ga4.visitors.toLocaleString('pt-BR')} visitas).` });
    } else if (sessDelta <= -10) {
      bullets.push({ status: 'bad', text: `Queda significativa nas sessões — ${fmtPct(sessDelta)} vs semana anterior. Verificar campanhas ativas.` });
    } else if (sessDelta < 0) {
      bullets.push({ status: 'warning', text: `Leve queda nas sessões — ${fmtPct(sessDelta)} vs semana anterior (${data.ga4.visitors.toLocaleString('pt-BR')} visitas).` });
    } else {
      bullets.push({ status: 'good', text: `Sessões estáveis em ${data.ga4.visitors.toLocaleString('pt-BR')} visitas esta semana.` });
    }
  } else {
    bullets.push({ status: 'warning', text: `${data.ga4.visitors.toLocaleString('pt-BR')} sessões registradas. Sem semana anterior para comparar ainda.` });
  }

  /* ── 2. Leads ── */
  const leadsDelta = prev ? pct(data.ga4.leads, prev.ga4.leads) : null;
  if (data.ga4.leads === 0) {
    bullets.push({ status: 'bad', text: 'Nenhum lead registrado no GA4 esta semana. Verifique os formulários e eventos de rastreamento.' });
  } else if (leadsDelta !== null) {
    if (leadsDelta >= 10) {
      bullets.push({ status: 'good', text: `Leads cresceram ${fmtPct(leadsDelta)} — ${data.ga4.leads} leads captados pelo GA4.` });
    } else if (leadsDelta <= -15) {
      bullets.push({ status: 'bad', text: `Queda de leads — ${fmtPct(leadsDelta)} vs semana anterior (${data.ga4.leads} leads). Analisar origem do tráfego.` });
    } else {
      bullets.push({ status: 'warning', text: `${data.ga4.leads} leads captados (${fmtPct(leadsDelta)} vs anterior). Acompanhar tendência nas próximas semanas.` });
    }
  } else {
    bullets.push({ status: 'warning', text: `${data.ga4.leads} leads captados pelo GA4 esta semana.` });
  }

  /* ── 3. Conversão lead → deal ── */
  const leads = data.ga4.leads;
  const deals = data.pipedrive.dealsCreated;
  if (leads > 0 && deals <= leads) {
    const conv = (deals / leads) * 100;
    if (conv >= 5) {
      bullets.push({ status: 'good', text: `Conversão de ${conv.toFixed(1)}% de leads para deals — dentro da meta (≥ 5%).` });
    } else if (conv >= 2) {
      bullets.push({ status: 'warning', text: `Conversão de ${conv.toFixed(1)}% de leads para deals — abaixo da meta de 5%. Revisar abordagem de vendas.` });
    } else {
      bullets.push({ status: 'bad', text: `Conversão crítica: ${conv.toFixed(1)}% dos leads viraram deals. Meta é 5% — investigar com urgência.` });
    }
  } else if (deals > leads && leads > 0) {
    bullets.push({ status: 'warning', text: `Pipedrive tem ${deals} deals e GA4 registrou ${leads} leads — sistemas contam de formas diferentes, comparação direta não é válida.` });
  }

  /* ── 4. Mídia paga ── */
  const bySource = data.ga4.bySource ?? {};
  const total = data.ga4.visitors;
  const paid = (bySource['Cross-network'] ?? 0) + (bySource['Paid Social'] ?? 0) + (bySource['Paid Search'] ?? 0) + (bySource['Paid Other'] ?? 0);
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  if (total > 0) {
    if (paidPct >= 50) {
      bullets.push({ status: 'good', text: `${paidPct.toFixed(0)}% das visitas vieram de mídia paga (${paid.toLocaleString('pt-BR')} sessões) — investimento gerando tráfego.` });
    } else if (paidPct >= 20) {
      bullets.push({ status: 'warning', text: `Apenas ${paidPct.toFixed(0)}% das visitas vieram de canais pagos. Verificar se as campanhas estão ativas e com orçamento suficiente.` });
    } else {
      bullets.push({ status: 'bad', text: `Somente ${paidPct.toFixed(0)}% das visitas de mídia paga. Com alto investimento em anúncios, esse número é preocupante.` });
    }
  }

  /* ── 5. Deals ganhos ── */
  if (data.pipedrive.dealsWon > 0) {
    const val = data.pipedrive.totalValue > 0
      ? ` — ${data.pipedrive.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} em valor`
      : '';
    bullets.push({ status: 'good', text: `${data.pipedrive.dealsWon} deal${data.pipedrive.dealsWon > 1 ? 's' : ''} ganho${data.pipedrive.dealsWon > 1 ? 's' : ''} no Pipedrive esta semana${val}.` });
  }

  return bullets;
}

function overallStatus(bullets: Bullet[]): Status {
  if (bullets.some(b => b.status === 'bad'))     return 'bad';
  if (bullets.some(b => b.status === 'warning')) return 'warning';
  return 'good';
}

const HEADER: Record<Status, string> = {
  good:    'Semana positiva',
  warning: 'Atenção em alguns pontos',
  bad:     'Requer ação imediata',
};

export default function ExecutiveSummary({ data }: { data: WeeklySnapshot }) {
  const bullets = buildBullets(data);
  const overall = overallStatus(bullets);
  const hc = COLOR[overall];

  return (
    <div className="glass" style={{ padding: '20px 24px', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: hc.bg, border: `1px solid ${hc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hc.icon, flexShrink: 0 }}>
          {ICON[overall]}
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
            Resumo da Semana — {HEADER[overall]}
          </p>
          <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0' }}>
            Gerado automaticamente com base nos dados de GA4, Pipedrive e MailPoet
          </p>
        </div>
      </div>

      {/* Bullets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bullets.map((b, i) => {
          const c = COLOR[b.status];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: c.bg, border: `1px solid ${c.border}` }}>
              <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>{ICON[b.status]}</span>
              <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.55 }}>{b.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
