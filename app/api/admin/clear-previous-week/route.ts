import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.SNAPSHOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blobs } = await list({ prefix: 'snapshots/weeks/' });
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Nenhum snapshot encontrado' }, { status: 404 });
    }

    const latest = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0];

    const res = await fetch(latest.url);
    if (!res.ok) {
      return NextResponse.json({ error: `Falha ao buscar blob: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    delete data.previousWeek;
    const content = JSON.stringify(data);

    await put(latest.pathname, content, { access: 'public', addRandomSuffix: false, allowOverwrite: true });
    await put('snapshots/latest.json', content, { access: 'public', addRandomSuffix: false, allowOverwrite: true });

    return NextResponse.json({ success: true, cleared: latest.pathname });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
