import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllSubmissions } from '@/lib/db';
import type { SubmissionRow } from '@/lib/db';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = getAllSubmissions();

  const headers: (keyof SubmissionRow)[] = [
    'confirmation_number', 'submitted_at', 'status', 'country',
    'company_name', 'dba', 'tax_classification', 'tin_type', 'tin_last4',
    'address_street', 'address_apt', 'address_city', 'address_state', 'address_zip',
    'accounting_name', 'accounting_phone', 'accounting_email',
    'remit_same_as_company', 'remit_street', 'remit_city', 'remit_state', 'remit_zip',
    'sales_name', 'sales_phone', 'sales_email', 'special_notes',
    'bank_name', 'bank_account_name', 'bank_address_street', 'bank_address_city', 'bank_address_state', 'bank_address_zip', 'bank_account_last4',
    'bank_routing_number', 'ca_transit_number', 'ca_institution_number',
    'payment_notification_email',
    'signature_name', 'signature_title', 'signature_phone', 'signature_date',
    'w9_certified', 'ach_authorized', 'internal_notes',
  ];

  function esc(v: unknown): string {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines: string[] = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => esc(row[h])).join(','));
  }

  const csv = lines.join('\r\n');
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bpn-vendor-submissions-${date}.csv"`,
    },
  });
}
