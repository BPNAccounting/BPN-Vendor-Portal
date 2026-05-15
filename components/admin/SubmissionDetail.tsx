'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, FileText, Loader2, Eye, EyeOff } from 'lucide-react';
import type { SubmissionRow } from '@/lib/db';
import { US_STATES, TAX_CLASSIFICATIONS } from '@/lib/constants';
import clsx from 'clsx';

type Props = {
  row: SubmissionRow;
  tin: string;
  accountNumber: string | null;
};

function stateLabel(code: string) { return US_STATES.find(s => s.value === code)?.label ?? code; }
function taxLabel(code: string) { return TAX_CLASSIFICATIONS.find(t => t.value === code)?.label ?? code; }

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <dl className="divide-y divide-slate-100 px-5">{children}</dl>
    </div>
  );
}

function RevealField({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 sm:col-span-2 sm:mt-0 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900 font-mono">
          {revealed ? value : '•'.repeat(value.replace(/\D/g, '').length - 4) + value.slice(-4)}
        </span>
        <button
          onClick={() => setRevealed(r => !r)}
          className="text-slate-400 hover:text-slate-600 ml-1"
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </dd>
    </div>
  );
}

const STATUS_OPTIONS = ['Pending Review', 'Approved', 'Needs Correction'];

export default function SubmissionDetail({ row, tin, accountNumber }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.internal_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [downloading, setDownloading] = useState('');

  async function saveAdmin() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/admin/submissions/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, internal_notes: notes }),
      });
      if (res.ok) {
        setSaveMsg('Saved');
        router.refresh();
      } else {
        setSaveMsg('Error saving');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  async function downloadPdf(type: string) {
    setDownloading(type);
    try {
      const res = await fetch(`/api/pdf/${row.id}/${type}`);
      if (!res.ok) { alert('PDF generation failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BPN-${type}-${row.confirmation_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading('');
    }
  }

  const address = `${row.address_street}${row.address_apt ? ` ${row.address_apt}` : ''}, ${row.address_city}, ${row.address_state} ${row.address_zip}`;
  const remitAddress = row.remit_same_as_company
    ? address
    : row.remit_street ? `${row.remit_street}, ${row.remit_city}, ${row.remit_state} ${row.remit_zip}` : '';

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{row.company_name}</h1>
          {row.dba && <p className="text-sm text-slate-500">DBA: {row.dba}</p>}
          <p className="text-xs text-slate-400 mt-1">
            Confirmation #{row.confirmation_number} · Submitted {new Date(row.submitted_at).toLocaleString()}
          </p>
        </div>

        {/* PDF Downloads */}
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'w9', label: 'W-9', usOnly: true },
            { type: 'vendor-setup', label: 'Vendor Setup', usOnly: false },
            { type: 'ach', label: row.country === 'CA' ? 'EFT Auth' : 'ACH Auth', usOnly: false },
            { type: 'all', label: 'All PDFs', usOnly: false },
          ]
            .filter(({ usOnly }) => !usOnly || row.country !== 'CA')
            .map(({ type, label }) => (
              <button
                key={type}
                onClick={() => downloadPdf(type)}
                disabled={!!downloading}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                {downloading === type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Company & Tax Information">
            <Field label="Country" value={row.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 United States'} />
            <Field label="Legal Name" value={row.company_name} />
            <Field label="DBA" value={row.dba} />
            {row.country !== 'CA' && (
              <Field label="Tax Classification" value={taxLabel(row.tax_classification) + (row.tax_classification === 'llc' ? ` (${row.tax_classification_llc})` : '') + (row.tax_classification === 'other' ? `: ${row.tax_classification_other}` : '')} />
            )}
            {row.country !== 'CA' && <Field label="Exempt Payee Code" value={row.exempt_payee_code} />}
            {row.country !== 'CA' && <Field label="FATCA Code" value={row.exempt_fatca_code} />}
            <Field label="Address" value={address} />
            <RevealField label={row.country === 'CA' ? 'Business Number (BN)' : `TIN (${row.tin_type})`} value={tin} />
          </Section>

          <Section title="Contacts & Remittance">
            <Field label="Accounting Contact" value={row.accounting_name} />
            <Field label="Accounting Phone" value={row.accounting_phone} />
            <Field label="Accounting Email" value={row.accounting_email} />
            <Field label="Remit-To Address" value={remitAddress} />
            <Field label="Sales Contact" value={row.sales_name} />
            <Field label="Sales Phone" value={row.sales_phone} />
            <Field label="Sales Email" value={row.sales_email} />
            <Field label="Special Notes" value={row.special_notes} />
          </Section>

          <Section title={row.country === 'CA' ? 'EFT Authorization' : 'ACH Authorization'}>
            <Field label="Financial Institution" value={row.bank_name} />
            <Field label="Name on Account" value={row.bank_account_name} />
            <Field label="Bank Address" value={`${row.bank_address_street}, ${row.bank_address_city}, ${row.bank_address_state} ${row.bank_address_zip}`} />
            {accountNumber && <RevealField label="Account Number" value={accountNumber} />}
            {row.country === 'CA' ? (
              <>
                <Field label="Transit Number" value={row.ca_transit_number} />
                <Field label="Institution Number" value={row.ca_institution_number} />
              </>
            ) : (
              <Field label="ABA Routing Number" value={row.bank_routing_number} />
            )}
            <Field label="Notification Email" value={row.payment_notification_email} />
          </Section>

          <Section title="Signature & Certifications">
            <Field label="Signed By" value={row.signature_name} />
            <Field label="Title" value={row.signature_title} />
            <Field label="Phone" value={row.signature_phone} />
            <Field label="Date Signed" value={row.signature_date} />
            {row.country !== 'CA' && <Field label="W-9 Certified" value={row.w9_certified ? '✓ Yes' : '✗ No'} />}
            <Field label={row.country === 'CA' ? 'EFT Authorized' : 'ACH Authorized'} value={row.ach_authorized ? '✓ Yes' : '✗ No'} />
          </Section>
        </div>

        {/* Right: admin controls */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Admin Actions</h3>

            <div>
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="form-select"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Internal Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="form-input"
                rows={4}
                placeholder="Reviewed by, approval notes, etc."
              />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={saveAdmin} disabled={saving} className="btn-primary text-sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saveMsg && (
                <span className={clsx('text-xs font-medium', saveMsg === 'Saved' ? 'text-green-600' : 'text-red-500')}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
