'use client';

import { FormField, Input } from './FormField';
import { US_STATES, TAX_CLASSIFICATIONS } from '@/lib/constants';
import type { FormData } from '@/lib/validation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type Props = {
  data: FormData;
  onChange: (field: keyof FormData, value: unknown) => void;
  errors: Partial<Record<keyof FormData, string>>;
  onEdit: (step: number) => void;
};

function ReviewSection({ title, children, step, onEdit }: {
  title: string; children: React.ReactNode; step: number; onEdit: (s: number) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-xs text-bpn-600 hover:text-bpn-700 font-medium">
          Edit
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 shrink-0 w-44">{label}:</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

export default function StepFour({ data, onChange, errors, onEdit }: Props) {
  const taxLabel = TAX_CLASSIFICATIONS.find(t => t.value === data.tax_classification)?.label ?? data.tax_classification;
  const stateLabel = (code: string) => US_STATES.find(s => s.value === code)?.label ?? code;

  const maskedTin = data.tin
    ? data.tin_type === 'SSN'
      ? `XXX-XX-${data.tin.replace(/\D/g, '').slice(-4)}`
      : `XX-XXXX${data.tin.replace(/\D/g, '').slice(-3)}`
    : '';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ReviewSection title="Step 1 — Company & Tax Info" step={1} onEdit={onEdit}>
          <div className="space-y-1.5">
            <Row label="Company Name" value={data.company_name} />
            <Row label="DBA" value={data.dba} />
            <Row label="Tax Classification" value={taxLabel + (data.tax_classification === 'llc' ? ` (${data.tax_classification_llc})` : '') + (data.tax_classification === 'other' ? `: ${data.tax_classification_other}` : '')} />
            <Row label="Exempt Payee Code" value={data.exempt_payee_code} />
            <Row label="FATCA Exemption Code" value={data.exempt_fatca_code} />
            <Row label="Address" value={`${data.address_street}${data.address_apt ? `, ${data.address_apt}` : ''}, ${data.address_city}, ${data.address_state} ${data.address_zip}`} />
            <Row label={data.tin_type} value={maskedTin} />
          </div>
        </ReviewSection>

        <ReviewSection title="Step 2 — Contacts & Remittance" step={2} onEdit={onEdit}>
          <div className="space-y-1.5">
            <Row label="Accounting Contact" value={data.accounting_name} />
            <Row label="Accounting Phone" value={data.accounting_phone} />
            <Row label="Accounting Email" value={data.accounting_email} />
            <Row label="Remit-To Address" value={data.remit_same_as_company ? 'Same as company address' : `${data.remit_street}, ${data.remit_city}, ${data.remit_state} ${data.remit_zip}`} />
            <Row label="Sales Contact" value={data.sales_name || undefined} />
            <Row label="Sales Phone" value={data.sales_phone || undefined} />
            <Row label="Sales Email" value={data.sales_email || undefined} />
            <Row label="Special Notes" value={data.special_notes || undefined} />
          </div>
        </ReviewSection>

        <ReviewSection title="Step 3 — ACH Authorization" step={3} onEdit={onEdit}>
          <div className="space-y-1.5">
            <Row label="Financial Institution" value={data.bank_name} />
            <Row label="Name on Account" value={data.bank_account_name} />
            <Row label="Bank Address" value={`${data.bank_address_street}, ${data.bank_address_city}, ${data.bank_address_state} ${data.bank_address_zip}`} />
            <Row label="Account Number" value={data.bank_account_number ? `••••••••${data.bank_account_number.slice(-4)}` : undefined} />
            <Row label="Routing Number" value={data.bank_routing_number} />
            <Row label="Notification Email" value={data.payment_notification_email} />
          </div>
        </ReviewSection>
      </div>

      {/* Signature block */}
      <div className="rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Electronic Signature</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Legal Name" required error={errors.signature_name}>
            <Input
              value={data.signature_name}
              onChange={e => onChange('signature_name', e.target.value)}
              placeholder="Type your full legal name"
              error={errors.signature_name}
            />
          </FormField>
          <FormField label="Title / Position" required error={errors.signature_title}>
            <Input
              value={data.signature_title}
              onChange={e => onChange('signature_title', e.target.value)}
              placeholder="e.g., CFO, Owner"
              error={errors.signature_title}
            />
          </FormField>
          <FormField label="Phone" required error={errors.signature_phone}>
            <Input
              value={data.signature_phone}
              onChange={e => onChange('signature_phone', e.target.value)}
              placeholder="(555) 555-5555"
              inputMode="tel"
              error={errors.signature_phone}
            />
          </FormField>
          <FormField label="Date">
            <Input
              value={data.signature_date}
              onChange={e => onChange('signature_date', e.target.value)}
              type="date"
            />
          </FormField>
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Certifications</h3>

        <div className={`rounded-lg border p-4 ${errors.w9_certified ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.w9_certified}
              onChange={e => onChange('w9_certified', e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded text-bpn-600 focus:ring-bpn-500 border-slate-300 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-800 mb-1">W-9 Certification</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Under penalties of perjury, I certify that: (1) The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); (2) I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS that I am subject to backup withholding, or (c) the IRS has notified me that I am no longer subject to backup withholding; (3) I am a U.S. citizen or other U.S. person; and (4) The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.
              </p>
            </div>
          </label>
          {errors.w9_certified && (
            <p className="form-error mt-2 ml-7">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.w9_certified}
            </p>
          )}
        </div>

        <div className={`rounded-lg border p-4 ${errors.ach_authorized ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.ach_authorized}
              onChange={e => onChange('ach_authorized', e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded text-bpn-600 focus:ring-bpn-500 border-slate-300 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-800 mb-1">ACH Payment Authorization</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                I authorize the ACH payment terms described in Step 3 and authorize Bare Performance Nutrition to initiate electronic fund transfers to the designated account.
              </p>
            </div>
          </label>
          {errors.ach_authorized && (
            <p className="form-error mt-2 ml-7">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.ach_authorized}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
        <p>
          Your information is transmitted securely. Sensitive data including your TIN and bank account information is encrypted before storage and is accessible only to authorized BPN personnel.
        </p>
      </div>
    </div>
  );
}
