import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-snapshot-secret');
  if (secret !== process.env.SNAPSHOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Accept "date" (daily) or fall back to today
  const dateKey =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().split('T')[0];

  const payload = JSON.stringify(body);

  await Promise.all([
    put('snapshots/latest.json', payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
    put(`snapshots/days/${dateKey}.json`, payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
  ]);

  return NextResponse.json({ success: true, dateKey });
}
