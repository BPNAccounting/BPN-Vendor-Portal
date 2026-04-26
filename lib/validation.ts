import { z } from 'zod';

const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;
const zipRegex = /^\d{5}(-\d{4})?$/;
const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
const einRegex = /^\d{2}-\d{7}$/;

export function validateRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const d = routing.split('').map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

export const step1Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  dba: z.string().optional(),
  tax_classification: z.string().min(1, 'Tax classification is required'),
  tax_classification_llc: z.string().optional(),
  tax_classification_other: z.string().optional(),
  exempt_payee_code: z.string().optional(),
  exempt_fatca_code: z.string().optional(),
  address_street: z.string().min(1, 'Street address is required'),
  address_apt: z.string().optional(),
  address_city: z.string().min(1, 'City is required'),
  address_state: z.string().min(2, 'State is required'),
  address_zip: z.string().regex(zipRegex, 'ZIP code must be 5 digits (or ZIP+4)'),
  tin_type: z.enum(['SSN', 'EIN']),
  tin: z.string().min(1, 'TIN is required'),
}).superRefine((data, ctx) => {
  if (data.tax_classification === 'llc' && !data.tax_classification_llc) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'LLC tax classification type is required', path: ['tax_classification_llc'] });
  }
  if (data.tax_classification === 'other' && !data.tax_classification_other) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please describe the other classification', path: ['tax_classification_other'] });
  }
  if (data.tin_type === 'SSN' && !ssnRegex.test(data.tin)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SSN must be in format XXX-XX-XXXX', path: ['tin'] });
  }
  if (data.tin_type === 'EIN' && !einRegex.test(data.tin)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'EIN must be in format XX-XXXXXXX', path: ['tin'] });
  }
});

export const step2Schema = z.object({
  accounting_name: z.string().min(1, 'Accounting contact name is required'),
  accounting_phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  accounting_email: z.string().email('Invalid email address'),
  remit_same_as_company: z.boolean(),
  remit_street: z.string().optional(),
  remit_city: z.string().optional(),
  remit_state: z.string().optional(),
  remit_zip: z.string().optional(),
  sales_name: z.string().optional(),
  sales_phone: z.string().optional(),
  sales_email: z.string().optional(),
  special_notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.remit_same_as_company) {
    if (!data.remit_street) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Remit-to street is required', path: ['remit_street'] });
    if (!data.remit_city) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Remit-to city is required', path: ['remit_city'] });
    if (!data.remit_state) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Remit-to state is required', path: ['remit_state'] });
    if (!data.remit_zip || !zipRegex.test(data.remit_zip)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid remit-to ZIP is required', path: ['remit_zip'] });
  }
  if (data.sales_phone && !phoneRegex.test(data.sales_phone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid phone number', path: ['sales_phone'] });
  }
  if (data.sales_email && !z.string().email().safeParse(data.sales_email).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address', path: ['sales_email'] });
  }
});

export const step3Schema = z.object({
  bank_name: z.string().min(1, 'Financial institution name is required'),
  bank_account_name: z.string().min(1, 'Name on account is required'),
  bank_address_street: z.string().min(1, 'Bank street address is required'),
  bank_address_city: z.string().min(1, 'Bank city is required'),
  bank_address_state: z.string().min(2, 'Bank state is required'),
  bank_address_zip: z.string().regex(zipRegex, 'Valid bank ZIP is required'),
  bank_account_number: z.string().min(4, 'Valid account number is required'),
  bank_routing_number: z.string().min(9, 'Routing number is required'),
  payment_notification_email: z.string().email('Invalid email address'),
}).superRefine((data, ctx) => {
  if (!validateRoutingNumber(data.bank_routing_number)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid ABA routing number', path: ['bank_routing_number'] });
  }
});

export const step4Schema = z.object({
  signature_name: z.string().min(1, 'Signature name is required'),
  signature_title: z.string().min(1, 'Title is required'),
  signature_phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  signature_date: z.string().min(1, 'Date is required'),
  w9_certified: z.literal(true, { errorMap: () => ({ message: 'You must certify the W-9 information' }) }),
  ach_authorized: z.literal(true, { errorMap: () => ({ message: 'You must acknowledge the ACH terms' }) }),
});

export type FormData = {
  // Step 1
  company_name: string;
  dba: string;
  tax_classification: string;
  tax_classification_llc: string;
  tax_classification_other: string;
  exempt_payee_code: string;
  exempt_fatca_code: string;
  address_street: string;
  address_apt: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  tin_type: 'SSN' | 'EIN';
  tin: string;
  // Step 2
  accounting_name: string;
  accounting_phone: string;
  accounting_email: string;
  remit_same_as_company: boolean;
  remit_street: string;
  remit_city: string;
  remit_state: string;
  remit_zip: string;
  sales_name: string;
  sales_phone: string;
  sales_email: string;
  special_notes: string;
  // Step 3
  bank_name: string;
  bank_account_name: string;
  bank_address_street: string;
  bank_address_city: string;
  bank_address_state: string;
  bank_address_zip: string;
  bank_account_number: string;
  bank_routing_number: string;
  payment_notification_email: string;
  // Step 4
  signature_name: string;
  signature_title: string;
  signature_phone: string;
  signature_date: string;
  w9_certified: boolean;
  ach_authorized: boolean;
};

export const initialFormData: FormData = {
  company_name: '',
  dba: '',
  tax_classification: '',
  tax_classification_llc: '',
  tax_classification_other: '',
  exempt_payee_code: '',
  exempt_fatca_code: '',
  address_street: '',
  address_apt: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  tin_type: 'EIN',
  tin: '',
  accounting_name: '',
  accounting_phone: '',
  accounting_email: '',
  remit_same_as_company: false,
  remit_street: '',
  remit_city: '',
  remit_state: '',
  remit_zip: '',
  sales_name: '',
  sales_phone: '',
  sales_email: '',
  special_notes: '',
  bank_name: '',
  bank_account_name: '',
  bank_address_street: '',
  bank_address_city: '',
  bank_address_state: '',
  bank_address_zip: '',
  bank_account_number: '',
  bank_routing_number: '',
  payment_notification_email: '',
  signature_name: '',
  signature_title: '',
  signature_phone: '',
  signature_date: new Date().toISOString().split('T')[0],
  w9_certified: false,
  ach_authorized: false,
};
