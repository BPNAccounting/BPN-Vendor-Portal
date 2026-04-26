import { neon } from '@neondatabase/serverless';

export type SubmissionRow = {
  id: string;
  confirmation_number: string;
  submitted_at: string;
  company_name: string;
  dba: string | null;
  tax_classification: string;
  tax_classification_llc: string | null;
  tax_classification_other: string | null;
  exempt_payee_code: string | null;
  exempt_fatca_code: string | null;
  address_street: string;
  address_apt: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  tin_type: string;
  tin_encrypted: string;
  tin_last4: string;
  accounting_name: string;
  accounting_phone: string;
  accounting_email: string;
  remit_same_as_company: boolean;
  remit_street: string | null;
  remit_city: string | null;
  remit_state: string | null;
  remit_zip: string | null;
  sales_name: string | null;
  sales_phone: string | null;
  sales_email: string | null;
  special_notes: string | null;
  bank_name: string;
  bank_account_name: string;
  bank_address_street: string;
  bank_address_city: string;
  bank_address_state: string;
  bank_address_zip: string;
  bank_account_number_encrypted: string;
  bank_account_last4: string;
  bank_routing_number: string;
  payment_notification_email: string;
  signature_name: string;
  signature_title: string;
  signature_phone: string;
  signature_date: string;
  w9_certified: boolean;
  ach_authorized: boolean;
  status: string;
  internal_notes: string | null;
};

const sql = neon(process.env.DATABASE_URL!);

export async function insertSubmission(row: SubmissionRow): Promise<void> {
  await sql`
    INSERT INTO submissions (
      id, confirmation_number, submitted_at, company_name, dba,
      tax_classification, tax_classification_llc, tax_classification_other,
      exempt_payee_code, exempt_fatca_code,
      address_street, address_apt, address_city, address_state, address_zip,
      tin_type, tin_encrypted, tin_last4,
      accounting_name, accounting_phone, accounting_email,
      remit_same_as_company, remit_street, remit_city, remit_state, remit_zip,
      sales_name, sales_phone, sales_email, special_notes,
      bank_name, bank_account_name,
      bank_address_street, bank_address_city, bank_address_state, bank_address_zip,
      bank_account_number_encrypted, bank_account_last4, bank_routing_number,
      payment_notification_email,
      signature_name, signature_title, signature_phone, signature_date,
      w9_certified, ach_authorized, status, internal_notes
    ) VALUES (
      ${row.id}, ${row.confirmation_number}, ${row.submitted_at},
      ${row.company_name}, ${row.dba},
      ${row.tax_classification}, ${row.tax_classification_llc}, ${row.tax_classification_other},
      ${row.exempt_payee_code}, ${row.exempt_fatca_code},
      ${row.address_street}, ${row.address_apt}, ${row.address_city}, ${row.address_state}, ${row.address_zip},
      ${row.tin_type}, ${row.tin_encrypted}, ${row.tin_last4},
      ${row.accounting_name}, ${row.accounting_phone}, ${row.accounting_email},
      ${row.remit_same_as_company}, ${row.remit_street}, ${row.remit_city}, ${row.remit_state}, ${row.remit_zip},
      ${row.sales_name}, ${row.sales_phone}, ${row.sales_email}, ${row.special_notes},
      ${row.bank_name}, ${row.bank_account_name},
      ${row.bank_address_street}, ${row.bank_address_city}, ${row.bank_address_state}, ${row.bank_address_zip},
      ${row.bank_account_number_encrypted}, ${row.bank_account_last4}, ${row.bank_routing_number},
      ${row.payment_notification_email},
      ${row.signature_name}, ${row.signature_title}, ${row.signature_phone}, ${row.signature_date},
      ${row.w9_certified}, ${row.ach_authorized}, ${row.status}, ${row.internal_notes}
    )
  `;
}

export async function getAllSubmissions(filters?: { status?: string; q?: string }): Promise<SubmissionRow[]> {
  const { status, q } = filters ?? {};

  if (status && q) {
    const like = `%${q}%`;
    return (await sql`
      SELECT * FROM submissions
      WHERE status = ${status}
        AND (company_name ILIKE ${like} OR COALESCE(dba, '') ILIKE ${like} OR confirmation_number ILIKE ${like})
      ORDER BY submitted_at DESC
    `) as SubmissionRow[];
  }
  if (status) {
    return (await sql`
      SELECT * FROM submissions WHERE status = ${status} ORDER BY submitted_at DESC
    `) as SubmissionRow[];
  }
  if (q) {
    const like = `%${q}%`;
    return (await sql`
      SELECT * FROM submissions
      WHERE company_name ILIKE ${like} OR COALESCE(dba, '') ILIKE ${like} OR confirmation_number ILIKE ${like}
      ORDER BY submitted_at DESC
    `) as SubmissionRow[];
  }
  return (await sql`SELECT * FROM submissions ORDER BY submitted_at DESC`) as SubmissionRow[];
}

export async function getSubmissionById(id: string): Promise<SubmissionRow | undefined> {
  const rows = (await sql`SELECT * FROM submissions WHERE id = ${id}`) as SubmissionRow[];
  return rows[0];
}

export async function updateSubmission(
  id: string,
  updates: { status: string; internal_notes: string | null },
): Promise<boolean> {
  const result = await sql`
    UPDATE submissions
    SET status = ${updates.status}, internal_notes = ${updates.internal_notes}
    WHERE id = ${id}
  `;
  return (result as unknown as { rowCount: number }).rowCount > 0;
}

export async function getStatusCounts(): Promise<Record<string, number>> {
  const rows = await sql`SELECT status, COUNT(*)::int AS count FROM submissions GROUP BY status`;
  const counts: Record<string, number> = { all: 0 };
  for (const row of rows) {
    counts[row.status as string] = row.count as number;
    counts.all += row.count as number;
  }
  return counts;
}
