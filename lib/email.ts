import { Resend } from 'resend';
import type { FormData } from '@/lib/validation';

const apiKey = process.env.RESEND_API_KEY;
const maskedKey = apiKey
  ? `${apiKey.slice(0, 6)}${'*'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
  : '(not set)';
console.log('[email] RESEND_API_KEY:', maskedKey);

const resend = new Resend(apiKey);

const TAX_CLASS_LABELS: Record<string, string> = {
  individual: 'Individual / Sole Proprietor',
  c_corp: 'C Corporation',
  s_corp: 'S Corporation',
  partnership: 'Partnership',
  trust: 'Trust / Estate',
  llc: 'Limited Liability Company (LLC)',
  other: 'Other',
};

function row(label: string, value: string | null | undefined) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:6px 12px;width:200px;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td>
      <td style="padding:6px 12px;color:#111827;font-size:13px;vertical-align:top">${value}</td>
    </tr>`;
}

function section(title: string, rows: string) {
  return `
    <div style="margin-bottom:24px">
      <div style="background:#f3f4f6;border-left:3px solid #d97706;padding:8px 14px;margin-bottom:0">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#92400e">${title}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-top:none">
        ${rows}
      </table>
    </div>`;
}

export async function sendVendorSubmissionEmail(
  data: FormData,
  confirmationNumber: string,
  submittedAt: string,
) {
  const taxClass = TAX_CLASS_LABELS[data.tax_classification] ?? data.tax_classification;
  const taxClassFull = data.tax_classification === 'llc' && data.tax_classification_llc
    ? `${taxClass} — ${data.tax_classification_llc === 'C' ? 'C Corp' : data.tax_classification_llc === 'S' ? 'S Corp' : 'Partnership'}`
    : data.tax_classification === 'other' && data.tax_classification_other
    ? `${taxClass}: ${data.tax_classification_other}`
    : taxClass;

  const companyAddress = [
    data.address_street,
    data.address_apt,
    `${data.address_city}, ${data.address_state} ${data.address_zip}`,
  ].filter(Boolean).join('\n').replace(/\n/g, '<br>');

  let remitAddress: string;
  if (data.remit_same_as_company) {
    remitAddress = 'Same as company address';
  } else {
    remitAddress = [
      data.remit_street,
      `${data.remit_city}, ${data.remit_state} ${data.remit_zip}`,
    ].filter(Boolean).join('\n').replace(/\n/g, '<br>');
  }

  const bankAddress = [
    data.bank_address_street,
    `${data.bank_address_city}, ${data.bank_address_state} ${data.bank_address_zip}`,
  ].join('<br>');

  const tinDisplay = `${data.tin_type}: •••••${data.tin.slice(-4)}`;

  const submittedDate = new Date(submittedAt).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const salesRows = (data.sales_name || data.sales_phone || data.sales_email)
    ? row('Name', data.sales_name) + row('Phone', data.sales_phone) + row('Email', data.sales_email)
    : row('', 'No sales contact provided');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <div style="background:#0f172a;padding:24px 32px;display:flex;align-items:center;gap:16px">
      <img src="${process.env.NEXT_PUBLIC_APP_URL}/bpn-logo.png" alt="BPN" style="height:36px;width:auto" />
      <div>
        <div style="color:#f8fafc;font-size:16px;font-weight:700;line-height:1.2">New Vendor Submission</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:2px">BPN Vendor Onboarding Portal</div>
      </div>
    </div>

    <!-- Meta bar -->
    <div style="background:#fef3c7;border-bottom:1px solid #fde68a;padding:12px 32px;display:flex;gap:32px">
      <div>
        <span style="font-size:11px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Reference</span>
        <div style="font-size:15px;font-weight:700;color:#78350f;font-family:monospace;letter-spacing:.05em">${confirmationNumber}</div>
      </div>
      <div>
        <span style="font-size:11px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Submitted</span>
        <div style="font-size:13px;color:#78350f">${submittedDate}</div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">

      ${section('Company & Tax Information',
        row('Company Name', data.company_name) +
        row('DBA', data.dba) +
        row('Tax Classification', taxClassFull) +
        row('Exempt Payee Code', data.exempt_payee_code) +
        row('Exempt FATCA Code', data.exempt_fatca_code) +
        row('Address', companyAddress) +
        row('TIN (masked)', tinDisplay)
      )}

      ${section('Accounting Contact',
        row('Name', data.accounting_name) +
        row('Phone', data.accounting_phone) +
        row('Email', data.accounting_email)
      )}

      ${section('Sales Contact', salesRows)}

      ${section('Remit-To Address', row('Address', remitAddress))}

      ${section('Special Notes', row('Notes', data.special_notes || '—'))}

      ${section('ACH / Bank Details',
        row('Bank Name', data.bank_name) +
        row('Account Name', data.bank_account_name) +
        row('Bank Address', bankAddress) +
        row('Routing Number', data.bank_routing_number) +
        row('Account Number', data.bank_account_number) +
        row('Payment Notification', data.payment_notification_email)
      )}

      ${section('Authorization',
        row('Authorized By', data.signature_name) +
        row('Title', data.signature_title) +
        row('Phone', data.signature_phone) +
        row('Date', data.signature_date) +
        row('W-9 Certified', data.w9_certified ? 'Yes' : 'No') +
        row('ACH Authorized', data.ach_authorized ? 'Yes' : 'No')
      )}

    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:#94a3b8">This email was automatically generated by the BPN Vendor Onboarding Portal. Do not reply to this email.</p>
    </div>

  </div>
</body>
</html>`;

  console.log('[email] sendVendorSubmissionEmail called', {
    to: 'accounting@bpnsupps.com',
    subject: `New Vendor Submission — ${data.company_name} [${confirmationNumber}]`,
    apiKeyPresent: !!apiKey,
  });

  const result = await resend.emails.send({
    from: 'BPN Vendor Portal <onboarding@resend.dev>',
    to: 'accounting@bpnsupps.com',
    subject: `New Vendor Submission — ${data.company_name} [${confirmationNumber}]`,
    html,
  });

  if (result.error) {
    console.error('[email] Resend API error:', result.error);
  } else {
    console.log('[email] Sent successfully, id:', result.data?.id);
  }
}
