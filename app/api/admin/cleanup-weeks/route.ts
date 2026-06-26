import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.SNAPSHOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keep = req.nextUrl.searchParams.get('keep') ?? '2026-06-26';
  const { blobs } = await list({ prefix: 'snapshots/weeks/' });

  const toDelete = blobs.filter(b => !b.pathname.endsWith(`${keep}.json`));

  if (toDelete.length === 0) {
    return NextResponse.json({ message: 'Nada para deletar', kept: blobs.map(b => b.pathname) });
  }

  await del(toDelete.map(b => b.url));

  return NextResponse.json({
    deleted: toDelete.map(b => b.pathname),
    kept: blobs.filter(b => b.pathname.endsWith(`${keep}.json`)).map(b => b.pathname),
  });
}
