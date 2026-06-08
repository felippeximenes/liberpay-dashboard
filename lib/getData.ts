import { WeeklySnapshot } from '@/types/snapshot';

export async function getSnapshotData(): Promise<WeeklySnapshot> {
  // FASE 3: substituir por leitura do Vercel Blob via NEXT_PUBLIC_SNAPSHOT_URL
  const res = await fetch('/data/mock.json');

  if (!res.ok) {
    throw new Error('Falha ao buscar snapshot');
  }

  return res.json();
}
