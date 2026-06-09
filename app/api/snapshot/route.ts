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

  const payload = JSON.stringify(body);

  // Derives week key from "YYYY-MM-DD/YYYY-MM-DD" → end date, fallback to today
  const weekStr = typeof body.week === 'string' ? body.week : '';
  const weekKey = weekStr.includes('/') ? weekStr.split('/')[1] : new Date().toISOString().split('T')[0];

  const [blob] = await Promise.all([
    put('snapshots/latest.json', payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
    put(`snapshots/weeks/${weekKey}.json`, payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
  ]);

  return NextResponse.json({ success: true, url: blob.url, weekKey });
}
