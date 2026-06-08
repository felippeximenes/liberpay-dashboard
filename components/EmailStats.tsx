import { WeeklySnapshot } from '@/types/snapshot';
import { UserPlus, Users, Mail, Zap } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

function StatCard({ icon, label, value, sub, valueColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${valueColor ?? 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmailStats({ data }: { data: WeeklySnapshot }) {
  const { mailpoet } = data;
  const openRateColor = mailpoet.openRate < 20 ? 'text-red-500' : 'text-green-600';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Email Marketing (MailPoet)</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<UserPlus size={20} />}
          label="Novos assinantes"
          value={mailpoet.newSubscribers.toLocaleString('pt-BR')}
          sub="esta semana"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Total de assinantes"
          value={mailpoet.totalSubscribers.toLocaleString('pt-BR')}
        />
        <StatCard
          icon={<Mail size={20} />}
          label="Taxa de abertura"
          value={`${mailpoet.openRate.toFixed(1)}%`}
          sub={mailpoet.openRate < 20 ? 'Abaixo do ideal (20%)' : 'Boa taxa'}
          valueColor={openRateColor}
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Automações ativas"
          value={String(mailpoet.automationsActive)}
        />
      </div>
    </div>
  );
}
