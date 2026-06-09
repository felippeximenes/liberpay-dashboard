import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'snapshots/weeks/' });
    const weeks = blobs
      .map((b) => ({
        key: b.pathname.replace('snapshots/weeks/', '').replace('.json', ''),
        url: b.url,
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
    return Response.json({ weeks });
  } catch {
    return Response.json({ weeks: [] });
  }
}
