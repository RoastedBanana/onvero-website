import { getSessionTenantId, getAdminClient } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import {
  EXPORT_FIELD_GROUPS,
  getFieldLabel,
  formatExportCell,
  parseFieldId,
  CONTACT_VALUE_SEPARATOR,
} from '../../../intelligence/leads/_export-fields';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Allowed (source, column) pairs derived from the catalogue, so a client can't
// inject arbitrary column names into the Supabase select string.
const ALLOWED_PAIRS = new Set<string>(
  EXPORT_FIELD_GROUPS.flatMap((g) =>
    g.fields.map((f) => `${f.source ?? 'lead'}:${f.key}`),
  ),
);

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

type ContactRow = Record<string, unknown> & {
  id: string;
  lead_id: string;
  apollo_person_id: string | null;
  is_primary: boolean | null;
  decision_maker_score: number | null;
  created_at: string;
};

// Mirror useContacts: merge `lead_contacts` + `lead_contact_enrichments`, dedupe
// by apollo_person_id, enrichment row wins (richer data) but missing fields are
// backfilled from the contact row. Returns a Map<leadId, sorted contacts>.
async function fetchContactsForLeads(
  supabase: ReturnType<typeof getAdminClient>,
  tenantId: string,
  leadIds: string[],
  contactColumns: string[],
): Promise<Map<string, ContactRow[]>> {
  const result = new Map<string, ContactRow[]>();
  if (leadIds.length === 0) return result;

  const baseCols = new Set([
    'id',
    'lead_id',
    'apollo_person_id',
    'is_primary',
    'decision_maker_score',
    'created_at',
  ]);
  for (const c of contactColumns) baseCols.add(c);
  const selectStr = Array.from(baseCols).join(',');

  const [r1, r2] = await Promise.all([
    supabase.from('lead_contacts').select(selectStr).eq('tenant_id', tenantId).in('lead_id', leadIds),
    supabase.from('lead_contact_enrichments').select(selectStr).in('lead_id', leadIds),
  ]);

  const grouped = new Map<string, Map<string, ContactRow>>();
  const addRow = (raw: unknown, fromEnrichment: boolean) => {
    const row = raw as ContactRow;
    if (!row?.lead_id) return;
    let byLead = grouped.get(row.lead_id);
    if (!byLead) {
      byLead = new Map();
      grouped.set(row.lead_id, byLead);
    }
    const key = row.apollo_person_id ? `apollo:${row.apollo_person_id}` : `id:${row.id}`;
    const existing = byLead.get(key);
    if (!existing) {
      byLead.set(key, row);
      return;
    }
    const preferred = fromEnrichment ? row : existing;
    const secondary = fromEnrichment ? existing : row;
    const merged: ContactRow = { ...secondary, ...preferred };
    for (const k of contactColumns) {
      if (merged[k] == null) merged[k] = secondary[k] ?? preferred[k];
    }
    byLead.set(key, merged);
  };

  if (!r1.error && Array.isArray(r1.data)) {
    for (const row of r1.data as unknown[]) addRow(row, false);
  }
  if (!r2.error && Array.isArray(r2.data)) {
    for (const row of r2.data as unknown[]) addRow(row, true);
  }

  for (const [leadId, byPerson] of grouped) {
    const list = Array.from(byPerson.values());
    list.sort((a, b) => {
      const ap = a.is_primary === true ? 1 : 0;
      const bp = b.is_primary === true ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const as = a.decision_maker_score ?? -1;
      const bs = b.decision_maker_score ?? -1;
      if (as !== bs) return bs - as;
      return (a.created_at ?? '').localeCompare(b.created_at ?? '');
    });
    result.set(leadId, list);
  }
  return result;
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

  const parsedFields = rawFields
    .filter((id) => ALLOWED_PAIRS.has(id))
    .map((id) => ({ id, ...parseFieldId(id)! }));
  if (parsedFields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const leadColumns = parsedFields.filter((f) => f.source === 'lead').map((f) => f.key);
  const contactColumns = parsedFields.filter((f) => f.source === 'contact').map((f) => f.key);

  const supabase = getAdminClient();

  const selectColumns = ['id', ...leadColumns].join(',');
  const { data, error } = await supabase
    .from('leads')
    .select(selectColumns)
    .eq('tenant_id', tenantId)
    .in('id', leadIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leadRows = (data ?? []) as unknown as Record<string, unknown>[];
  const byId = new Map(leadRows.map((r) => [r.id as string, r]));
  const orderedRows = leadIds.map((id) => byId.get(id)).filter(Boolean) as Record<string, unknown>[];

  const contactsByLead =
    contactColumns.length > 0
      ? await fetchContactsForLeads(supabase, tenantId, leadIds, contactColumns)
      : new Map<string, ContactRow[]>();

  // Build flat output rows.
  const outputRows = orderedRows.map((leadRow) => {
    const leadId = leadRow.id as string;
    const contacts = contactsByLead.get(leadId) ?? [];
    return parsedFields.map((f) => {
      if (f.source === 'lead') return formatExportCell(leadRow[f.key]);
      if (contacts.length === 0) return '';
      return contacts
        .map((c) => formatExportCell(c[f.key]))
        .map((v) => (v === '' ? '' : String(v)))
        .join(CONTACT_VALUE_SEPARATOR);
    });
  });

  const headerLabels = parsedFields.map((f) => getFieldLabel(f.id));
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const headerLine = headerLabels.map((l) => csvEscape(l)).join(',');
    const lines = outputRows.map((row) => row.map((cell) => csvEscape(cell)).join(','));
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

  sheet.columns = parsedFields.map((f) => ({
    header: getFieldLabel(f.id),
    key: f.id,
    width: Math.min(Math.max(getFieldLabel(f.id).length + 4, 14), 48),
  }));

  for (const row of outputRows) {
    const rowData: Record<string, string | number | boolean> = {};
    parsedFields.forEach((f, i) => {
      rowData[f.id] = row[i];
    });
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
