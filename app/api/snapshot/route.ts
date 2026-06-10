import { put, list } from '@vercel/blob';
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

  // Derive week key from "YYYY-MM-DD/YYYY-MM-DD" → end date, fallback to today
  const weekStr = typeof body.week === 'string' ? body.week : '';
  const weekKey = weekStr.includes('/') ? weekStr.split('/')[1] : new Date().toISOString().split('T')[0];

  // Calculate previous week key (7 days before current end date)
  const prevDate = new Date(weekKey + 'T00:00:00Z');
  prevDate.setUTCDate(prevDate.getUTCDate() - 7);
  const prevWeekKey = prevDate.toISOString().split('T')[0];

  // Fetch previous week snapshot from Blob to attach as previousWeek
  let previousWeek: unknown = null;
  try {
    const { blobs } = await list({ prefix: `snapshots/weeks/${prevWeekKey}` });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url);
      if (res.ok) {
        const prevData = await res.json();
        // Strip nested previousWeek to avoid infinite nesting
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { previousWeek: _nested, ...clean } = prevData;
        previousWeek = clean;
      }
    }
  } catch {
    // Proceed without previousWeek if Blob is unavailable
  }

  const payload = JSON.stringify({ ...body, previousWeek });

  const [blob] = await Promise.all([
    put('snapshots/latest.json', payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
    put(`snapshots/weeks/${weekKey}.json`, payload, {
      access: 'public', contentType: 'application/json', allowOverwrite: true,
    }),
  ]);

  return NextResponse.json({ success: true, url: blob.url, weekKey, prevWeekKey });
}
