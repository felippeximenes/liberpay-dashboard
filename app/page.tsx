import { WeeklySnapshot } from '@/types/snapshot';
import FunnelChart from '@/components/FunnelChart';
import SourceChart from '@/components/SourceChart';
import EmailStats from '@/components/EmailStats';
import WeeklyTable from '@/components/WeeklyTable';
import Image from 'next/image';
import { readFileSync } from 'fs';
import { join } from 'path';

async function getSnapshotData(): Promise<WeeklySnapshot> {
  const blobUrl = process.env.NEXT_PUBLIC_SNAPSHOT_URL;

  if (blobUrl) {
    const res = await fetch(blobUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Falha ao buscar snapshot');
    return res.json();
  }

  // Fallback: lê o mock diretamente do filesystem (sem depender de servidor HTTP)
  const filePath = join(process.cwd(), 'public', 'data', 'mock.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function formatWeek(week: string): string {
  const parts = week.split('/');
  if (parts.length !== 2) return week;
  const [start, end] = parts;
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00Z');
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };
  return `Semana de ${fmt(start)} a ${fmt(end)}`;
}

export default async function DashboardPage() {
  const data = await getSnapshotData();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="LiberPay" width={120} height={36} className="object-contain" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>
              {formatWeek(data.week)}
            </p>
            <p className="text-xs" style={{ color: '#718096' }}>
              Atualizado em{' '}
              {new Date(data.generatedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Funil + Origens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={data} />
          <SourceChart data={data} />
        </div>

        {/* Email Stats */}
        <EmailStats data={data} />

        {/* Tabela comparativa */}
        <WeeklyTable data={data} />
      </main>

      <footer className="text-center py-6 text-xs" style={{ color: '#718096' }}>
        LiberPay &copy; {new Date().getFullYear()} — Dashboard interno
      </footer>
    </div>
  );
}
