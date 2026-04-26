import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { insertSubmission } from '@/lib/db';
import { encrypt, lastFour } from '@/lib/encryption';
import { step1Schema, step2Schema, step3Schema, step4Schema } from '@/lib/validation';
import type { FormData } from '@/lib/validation';
import { sendVendorSubmissionEmail } from '@/lib/email';

function generateConfirmation(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BPN-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: FormData = await req.json();

    for (const schema of [step1Schema, step2Schema, step3Schema, step4Schema]) {
      const result = (schema as typeof step1Schema).safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Validation failed', issues: result.error.issues },
          { status: 400 }
        );
      }
    }

    const id = randomUUID();
    const confirmationNumber = generateConfirmation();
    const submittedAt = new Date().toISOString();

    await insertSubmission({
      id,
      confirmation_number: confirmationNumber,
      submitted_at: submittedAt,
      company_name: body.company_name,
      dba: body.dba || null,
      tax_classification: body.tax_classification,
      tax_classification_llc: body.tax_classification_llc || null,
      tax_classification_other: body.tax_classification_other || null,
      exempt_payee_code: body.exempt_payee_code || null,
      exempt_fatca_code: body.exempt_fatca_code || null,
      address_street: body.address_street,
      address_apt: body.address_apt || null,
      address_city: body.address_city,
      address_state: body.address_state,
      address_zip: body.address_zip,
      tin_type: body.tin_type,
      tin_encrypted: encrypt(body.tin),
      tin_last4: lastFour(body.tin),
      accounting_name: body.accounting_name,
      accounting_phone: body.accounting_phone,
      accounting_email: body.accounting_email,
      remit_same_as_company: body.remit_same_as_company,
      remit_street: body.remit_street || null,
      remit_city: body.remit_city || null,
      remit_state: body.remit_state || null,
      remit_zip: body.remit_zip || null,
      sales_name: body.sales_name || null,
      sales_phone: body.sales_phone || null,
      sales_email: body.sales_email || null,
      special_notes: body.special_notes || null,
      bank_name: body.bank_name,
      bank_account_name: body.bank_account_name,
      bank_address_street: body.bank_address_street,
      bank_address_city: body.bank_address_city,
      bank_address_state: body.bank_address_state,
      bank_address_zip: body.bank_address_zip,
      bank_account_number_encrypted: encrypt(body.bank_account_number),
      bank_account_last4: lastFour(body.bank_account_number),
      bank_routing_number: body.bank_routing_number,
      payment_notification_email: body.payment_notification_email,
      signature_name: body.signature_name,
      signature_title: body.signature_title,
      signature_phone: body.signature_phone,
      signature_date: body.signature_date,
      w9_certified: body.w9_certified,
      ach_authorized: body.ach_authorized,
      status: 'Pending Review',
      internal_notes: null,
    });

    console.log('[submit] Submission saved, firing email for', confirmationNumber);
    sendVendorSubmissionEmail(body, confirmationNumber, submittedAt).catch((err) =>
      console.error('[submit] Email send threw:', err)
    );

    return NextResponse.json({ confirmationNumber }, { status: 201 });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
