import { WeeklySnapshot } from '@/types/snapshot';
import { UserPlus, Users, Mail, Zap } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  gradient: string;
  shadow: string;
}

function StatItem({ icon, label, value, sub, accent, gradient, shadow }: StatItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(237,241,251,0.90)' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: gradient, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${shadow}`,
      }}>
        {icon}
      </div>
      {/* minWidth: 0 allows this flex child to shrink below its content size */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', color: '#A0ABBF', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        {sub && <p style={{ fontSize: '11px', color: '#B0BCCE', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
      <span style={{ fontSize: '17px', fontWeight: 700, color: accent, letterSpacing: '-0.3px', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

export default function EmailStats({ data }: { data: WeeklySnapshot }) {
  const { mailpoet } = data;

  const newSubscribers = data.previousWeek
    ? Math.max(0, mailpoet.totalSubscribers - data.previousWeek.mailpoet.totalSubscribers)
    : mailpoet.newSubscribers;

  const rateAccent = mailpoet.openRate < 20 ? '#E03E5A' : '#00C0A0';
  const rateGradient = mailpoet.openRate < 20
    ? 'linear-gradient(135deg, #E03E5A, #F07090)'
    : 'linear-gradient(135deg, #00C0A0, #00DDB8)';
  const rateShadow = mailpoet.openRate < 20 ? 'rgba(224,62,90,0.28)' : 'rgba(0,192,160,0.28)';

  return (
    <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A2340', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
        Email Marketing
      </h2>
      <p style={{ fontSize: '12px', color: '#A0ABBF', margin: '0 0 4px' }}>MailPoet</p>
      <div>
        <StatItem
          icon={<UserPlus size={16} />}
          label="Novos assinantes"
          value={newSubscribers.toLocaleString('pt-BR')}
          sub="esta semana"
          accent="#3B7DD8"
          gradient="linear-gradient(135deg, #3B7DD8, #6EA8F0)"
          shadow="rgba(59,125,216,0.28)"
        />
        <StatItem
          icon={<Users size={16} />}
          label="Total de assinantes"
          value={mailpoet.totalSubscribers.toLocaleString('pt-BR')}
          accent="#7B6FD0"
          gradient="linear-gradient(135deg, #7B6FD0, #A99FE8)"
          shadow="rgba(123,111,208,0.28)"
        />
        <StatItem
          icon={<Mail size={16} />}
          label="Taxa de abertura"
          value={`${mailpoet.openRate.toFixed(1)}%`}
          sub={mailpoet.openRate < 20 ? 'Abaixo de 20% (ideal)' : 'Boa taxa de abertura'}
          accent={rateAccent}
          gradient={rateGradient}
          shadow={rateShadow}
        />
        <StatItem
          icon={<Zap size={16} />}
          label="Automações ativas"
          value={String(mailpoet.automationsActive)}
          accent="#F0883E"
          gradient="linear-gradient(135deg, #F0883E, #F6B05E)"
          shadow="rgba(240,136,62,0.28)"
        />
      </div>
    </div>
  );
}
