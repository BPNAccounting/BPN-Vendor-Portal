import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'submissions.json');

export type SubmissionRow = {
  id: string;
  confirmation_number: string;
  submitted_at: string;
  country: 'US' | 'CA';
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
  bank_routing_number: string;    // US: ABA routing; empty for CA
  ca_transit_number: string | null;     // CA only
  ca_institution_number: string | null; // CA only
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

type Store = { submissions: SubmissionRow[] };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): Store {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) return { submissions: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { submissions: [] };
  }
}

function writeStore(store: Store): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export function insertSubmission(row: SubmissionRow): void {
  const store = readStore();
  store.submissions.push(row);
  writeStore(store);
}

export function getAllSubmissions(filters?: { status?: string; q?: string }): SubmissionRow[] {
  let rows = readStore().submissions.slice().reverse(); // newest first
  if (filters?.status) {
    rows = rows.filter(r => r.status === filters.status);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(r =>
      r.company_name.toLowerCase().includes(q) ||
      (r.dba ?? '').toLowerCase().includes(q) ||
      r.confirmation_number.toLowerCase().includes(q)
    );
  }
  return rows;
}

export function getSubmissionById(id: string): SubmissionRow | undefined {
  return readStore().submissions.find(s => s.id === id);
}

export function updateSubmission(id: string, updates: { status: string; internal_notes: string | null }): boolean {
  const store = readStore();
  const idx = store.submissions.findIndex(s => s.id === id);
  if (idx === -1) return false;
  store.submissions[idx] = { ...store.submissions[idx], ...updates };
  writeStore(store);
  return true;
}

export function getStatusCounts(): Record<string, number> {
  const rows = readStore().submissions;
  const counts: Record<string, number> = { all: rows.length };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
