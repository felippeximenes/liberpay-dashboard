import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-snapshot-secret');
  if (secret !== process.env.SNAPSHOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const blob = await put('snapshots/latest.json', JSON.stringify(body), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });

  return NextResponse.json({ success: true, url: blob.url });
}
