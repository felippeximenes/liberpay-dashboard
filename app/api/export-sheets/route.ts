import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { WeeklySnapshot } from '@/types/snapshot';

const DARK_BLUE  = { red: 0.133, green: 0.173, blue: 0.380 };
const MED_BLUE   = { red: 0.200, green: 0.247, blue: 0.478 };
const WHITE      = { red: 1, green: 1, blue: 1 };
const LIGHT_GRAY = { red: 0.945, green: 0.949, blue: 0.961 };

function fmtPct(curr: number | null, prev: number | null | undefined): string {
  if (curr === null || prev === null || prev === undefined || prev === 0) return '—';
  const d = ((curr - prev) / prev) * 100;
  return `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`;
}

function conv(from: number, to: number | null): string {
  if (to === null || from === 0) return '—';
  return `${((to / from) * 100).toFixed(1)}%`;
}

function headerRow(sheetId: number, rowIndex: number, numCols: number) {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: numCols },
      cell: { userEnteredFormat: { backgroundColor: DARK_BLUE, textFormat: { bold: true, foregroundColor: WHITE, fontSize: 11 } } },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  };
}

function subHeader(sheetId: number, rowIndex: number, numCols: number) {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: numCols },
      cell: { userEnteredFormat: { backgroundColor: MED_BLUE, textFormat: { bold: true, foregroundColor: WHITE } } },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  };
}

function zebraRow(sheetId: number, rowIndex: number, numCols: number) {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: numCols },
      cell: { userEnteredFormat: { backgroundColor: LIGHT_GRAY } },
      fields: 'userEnteredFormat(backgroundColor)',
    },
  };
}

function autoResize(sheetId: number, numCols: number) {
  return {
    autoResizeDimensions: {
      dimensions: { sheetId, dimension: 'COLUMNS' as const, startIndex: 0, endIndex: numCols },
    },
  };
}

export async function POST(req: NextRequest) {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    return NextResponse.json({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON não configurado no Vercel' }, { status: 500 });
  }

  let credentials;
  try {
    credentials = JSON.parse(credJson);
  } catch (e) {
    return NextResponse.json({ error: 'JSON inválido em GOOGLE_SERVICE_ACCOUNT_JSON', detail: String(e) }, { status: 500 });
  }

  let data: WeeklySnapshot;
  try {
    data = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao ler body da requisição', detail: String(e) }, { status: 500 });
  }
  const prev = data.previousWeek;

  try {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive  = google.drive({ version: 'v3', auth });

  const PAID_CH    = new Set(['Cross-network', 'Paid Social', 'Paid Search', 'Paid Other']);
  const ORGANIC_CH = new Set(['Organic Search', 'Organic Social', 'Organic Video']);

  /* ── Sheet data ─────────────────────────────────────────── */

  const resumoRows = [
    ['Resumo da Semana — LiberPay Dashboard', '', '', ''],
    ['Semana', data.week, '', ''],
    ['Gerado em', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), '', ''],
    ['', '', '', ''],
    ['Métrica', 'Esta semana', 'Semana anterior', 'Variação'],
    ['Sessões',            data.ga4.visitors,              prev?.ga4.visitors ?? '—',              fmtPct(data.ga4.visitors, prev?.ga4.visitors)],
    ['Novos usuários',     data.ga4.newUsers,              prev?.ga4.newUsers ?? '—',              fmtPct(data.ga4.newUsers, prev?.ga4.newUsers)],
    ['Leads (Pipedrive)',  data.pipedrive.leadsCreated,    prev?.pipedrive.leadsCreated ?? '—',    fmtPct(data.pipedrive.leadsCreated, prev?.pipedrive.leadsCreated)],
    ['Deals criados',      data.pipedrive.dealsCreated,    prev?.pipedrive.dealsCreated ?? '—',    fmtPct(data.pipedrive.dealsCreated, prev?.pipedrive.dealsCreated)],
    ['Deals ganhos',       data.pipedrive.dealsWon,        prev?.pipedrive.dealsWon ?? '—',        fmtPct(data.pipedrive.dealsWon, prev?.pipedrive.dealsWon)],
    ['Valor total (R$)',   data.pipedrive.totalValue,      prev?.pipedrive.totalValue ?? '—',      fmtPct(data.pipedrive.totalValue, prev?.pipedrive.totalValue)],
    ['Total assinantes',   data.mailpoet.totalSubscribers, prev?.mailpoet.totalSubscribers ?? '—', fmtPct(data.mailpoet.totalSubscribers, prev?.mailpoet.totalSubscribers)],
    ['Novos assinantes',   data.mailpoet.newSubscribers,   prev?.mailpoet.newSubscribers ?? '—',   fmtPct(data.mailpoet.newSubscribers, prev?.mailpoet.newSubscribers)],
    [`Taxa de abertura`, `${data.mailpoet.openRate.toFixed(1)}%`, prev ? `${prev.mailpoet.openRate.toFixed(1)}%` : '—', ''],
    ['Automações ativas',  data.mailpoet.automationsActive, '', ''],
  ];

  const funnelRows = [
    ['Funil de Vendas', '', '', '', ''],
    ['Etapa', 'Valor', 'Taxa de conversão', 'Meta', 'Fonte'],
    ['Sessões',      data.ga4.visitors,                '—',                                                              '—',   'GA4'],
    ['Leads',        data.pipedrive.leadsCreated,     '—',                                                              '—',   'Pipedrive'],
    ['Deals criados',data.pipedrive.dealsCreated,     conv(data.pipedrive.leadsCreated, data.pipedrive.dealsCreated),   '30%', 'Pipedrive'],
    ['Deals ganhos', data.pipedrive.dealsWon,         conv(data.pipedrive.dealsCreated, data.pipedrive.dealsWon),       '20%', 'Pipedrive'],
  ];

  const sourceEntries = Object.entries(data.ga4.bySource ?? {}).sort(([, a], [, b]) => b - a);
  const sourceTotal   = sourceEntries.reduce((s, [, v]) => s + v, 0);
  const origemRows = [
    ['Origem dos Visitantes', '', '', ''],
    ['Canal', 'Sessões', '% do total', 'Tipo'],
    ...sourceEntries.map(([src, val]) => [
      src,
      val,
      sourceTotal > 0 ? `${((val / sourceTotal) * 100).toFixed(1)}%` : '0%',
      PAID_CH.has(src) ? 'Pago' : ORGANIC_CH.has(src) ? 'Orgânico' : 'Direto / Outros',
    ]),
  ];

  const emailRows = [
    ['Email Marketing', ''],
    ['Métrica', 'Valor'],
    ['Novos assinantes',   data.mailpoet.newSubscribers],
    ['Total assinantes',   data.mailpoet.totalSubscribers],
    ['Taxa de abertura',   `${data.mailpoet.openRate.toFixed(1)}%`],
    ['Automações ativas',  data.mailpoet.automationsActive],
  ];

  /* ── Create spreadsheet ─────────────────────────────────── */

  const title = `LiberPay · ${data.week.replace(/\//g, ' → ')}`;

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        { properties: { title: 'Resumo',  sheetId: 0 } },
        { properties: { title: 'Funil',   sheetId: 1 } },
        { properties: { title: 'Origem',  sheetId: 2 } },
        { properties: { title: 'Email',   sheetId: 3 } },
      ],
    },
  });

  const sid = created.data.spreadsheetId!;

  /* ── Populate data ─────────────────────────────────────── */

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sid,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Resumo!A1',  values: resumoRows },
        { range: 'Funil!A1',   values: funnelRows },
        { range: 'Origem!A1',  values: origemRows },
        { range: 'Email!A1',   values: emailRows  },
      ],
    },
  });

  /* ── Formatting ─────────────────────────────────────────── */

  const formatRequests = [
    // Title rows (row 0 of each sheet)
    headerRow(0, 0, 4), headerRow(1, 0, 5), headerRow(2, 0, 4), headerRow(3, 0, 2),
    // Column header rows
    subHeader(0, 4, 4),  // Resumo: row 4
    subHeader(1, 1, 5),  // Funil: row 1
    subHeader(2, 1, 4),  // Origem: row 1
    subHeader(3, 1, 2),  // Email: row 1
    // Zebra rows for Resumo (data rows 5–14 → even rows)
    ...[5, 7, 9, 11, 13].map(r => zebraRow(0, r, 4)),
    // Zebra rows for Funil
    ...[2, 4].map(r => zebraRow(1, r, 5)),
    // Zebra rows for Origem
    ...sourceEntries.map((_, i) => i % 2 === 0 ? zebraRow(2, i + 2, 4) : null).filter(Boolean) as object[],
    // Zebra rows for Email
    ...[2, 4].map(r => zebraRow(3, r, 2)),
    // Auto resize all
    autoResize(0, 4), autoResize(1, 5), autoResize(2, 4), autoResize(3, 2),
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sid,
    requestBody: { requests: formatRequests },
  });

  /* ── Share ─────────────────────────────────────────────── */

  // Share as editor with configured email
  const shareEmail = process.env.GOOGLE_SHARE_EMAIL;
  if (shareEmail) {
    await drive.permissions.create({
      fileId: sid,
      sendNotificationEmail: false,
      requestBody: { role: 'writer', type: 'user', emailAddress: shareEmail },
    });
  }

  return NextResponse.json({
    url: `https://docs.google.com/spreadsheets/d/${sid}/edit`,
  });
  } catch (e) {
    console.error('export-sheets error:', e);
    return NextResponse.json({ error: 'Erro ao criar planilha', detail: String(e) }, { status: 500 });
  }
}
