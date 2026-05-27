import { getSessionTenantId, getAdminClient } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { EXPORT_FIELD_GROUPS, getFieldLabel, formatExportCell } from '../../../intelligence/leads/_export-fields';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_FIELDS = new Set(EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key)));

type Body = {
  leadIds?: unknown;
  fields?: unknown;
  format?: unknown;
};

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  if (s === '') return '';
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function POST(req: Request) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const leadIds = Array.isArray(body.leadIds) ? (body.leadIds.filter((x) => typeof x === 'string') as string[]) : [];
  const rawFields = Array.isArray(body.fields) ? (body.fields.filter((x) => typeof x === 'string') as string[]) : [];
  const format = body.format === 'xlsx' ? 'xlsx' : 'csv';

  if (leadIds.length === 0) return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
  if (rawFields.length === 0) return NextResponse.json({ error: 'No fields selected' }, { status: 400 });

  const fields = rawFields.filter((f) => ALLOWED_FIELDS.has(f));
  if (fields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const selectColumns = ['id', ...fields].join(',');

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .select(selectColumns)
    .eq('tenant_id', tenantId)
    .in('id', leadIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  // Preserve original input order (Supabase doesn't guarantee it for .in())
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  const orderedRows = leadIds.map((id) => byId.get(id)).filter(Boolean) as Record<string, unknown>[];

  const headerLabels = fields.map((f) => getFieldLabel(f));
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const headerLine = headerLabels.map((l) => csvEscape(l)).join(',');
    const lines = orderedRows.map((row) =>
      fields.map((f) => csvEscape(formatExportCell(row[f]))).join(','),
    );
    // BOM so Excel opens UTF-8 CSVs correctly
    const csv = '﻿' + [headerLine, ...lines].join('\r\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${dateStamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // xlsx
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Onvero';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Leads');

  sheet.columns = fields.map((f) => ({
    header: getFieldLabel(f),
    key: f,
    width: Math.min(Math.max(getFieldLabel(f).length + 4, 14), 48),
  }));

  for (const row of orderedRows) {
    const rowData: Record<string, string | number | boolean> = {};
    for (const f of fields) rowData[f] = formatExportCell(row[f]);
    sheet.addRow(rowData);
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leads-export-${dateStamp}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
