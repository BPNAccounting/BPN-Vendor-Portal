import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import type { SubmissionRow } from './db';
import { decrypt } from './encryption';
import { US_STATES, CA_PROVINCES, TAX_CLASSIFICATIONS } from './constants';

const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const GRAY = rgb(0.5, 0.5, 0.5);
const BPN_BLUE = rgb(1.0, 0.267, 0.220); // #FF4438 brand red
const LIGHT_GRAY = rgb(0.95, 0.95, 0.95);

function stateName(code: string, country: 'US' | 'CA' = 'US'): string {
  if (country === 'CA') return CA_PROVINCES.find(p => p.value === code)?.label ?? code;
  return US_STATES.find(s => s.value === code)?.label ?? code;
}

function taxClassLabel(code: string): string {
  return TAX_CLASSIFICATIONS.find(t => t.value === code)?.label ?? code;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

type DrawContext = {
  page: PDFPage;
  bold: PDFFont;
  regular: PDFFont;
  width: number;
  height: number;
};

function drawText(ctx: DrawContext, text: string, x: number, y: number, opts: {
  font?: PDFFont;
  size?: number;
  color?: ReturnType<typeof rgb>;
  maxWidth?: number;
} = {}) {
  const { page, regular } = ctx;
  const font = opts.font ?? regular;
  const size = opts.size ?? 10;
  const color = opts.color ?? BLACK;

  let displayText = text;
  if (opts.maxWidth && font.widthOfTextAtSize(text, size) > opts.maxWidth) {
    // Truncate text to fit
    while (displayText.length > 3 && font.widthOfTextAtSize(displayText + '...', size) > opts.maxWidth) {
      displayText = displayText.slice(0, -1);
    }
    displayText = displayText + '...';
  }

  page.drawText(displayText, { x, y, font, size, color });
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = BLACK, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, fillColor: ReturnType<typeof rgb>, borderColor?: ReturnType<typeof rgb>) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: fillColor,
    borderColor,
    borderWidth: borderColor ? 0.5 : 0,
  });
}

function drawField(ctx: DrawContext, label: string, value: string, x: number, y: number, fieldWidth: number) {
  const { page, bold, regular } = ctx;
  drawRect(page, x, y - 18, fieldWidth, 22, LIGHT_GRAY, rgb(0.8, 0.8, 0.8));
  page.drawText(label, { x: x + 4, y: y - 10, font: regular, size: 7, color: GRAY });
  page.drawText(value || '—', { x: x + 4, y: y - 14, font: value ? bold : regular, size: 9, color: value ? BLACK : GRAY });
}

function sectionHeader(ctx: DrawContext, title: string, y: number) {
  const { page, bold, width } = ctx;
  drawRect(page, 36, y - 4, width - 72, 18, BPN_BLUE);
  page.drawText(title, { x: 44, y, font: bold, size: 10, color: rgb(1, 1, 1) });
  return y - 24;
}

function pageHeader(ctx: DrawContext, title: string, subtitle: string) {
  const { page, bold, regular, width, height } = ctx;
  // Header bar
  drawRect(page, 0, height - 60, width, 60, BPN_BLUE);
  // Logo placeholder / company name
  page.drawText('BARE PERFORMANCE NUTRITION', {
    x: 36, y: height - 26, font: bold, size: 14, color: rgb(1, 1, 1),
  });
  page.drawText('bpnsupps.com  |  accounting@bpnsupps.com', {
    x: 36, y: height - 42, font: regular, size: 8, color: rgb(0.8, 0.9, 1),
  });
  page.drawText(title, {
    x: width - 36 - bold.widthOfTextAtSize(title, 14),
    y: height - 26, font: bold, size: 14, color: rgb(1, 1, 1),
  });
  page.drawText(subtitle, {
    x: width - 36 - regular.widthOfTextAtSize(subtitle, 8),
    y: height - 42, font: regular, size: 8, color: rgb(0.8, 0.9, 1),
  });
  return height - 80;
}

// ─── W-9 PDF ──────────────────────────────────────────────────────────────────
export async function generateW9Pdf(row: SubmissionRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, height };

  let y = pageHeader(ctx, 'W-9', 'Request for Taxpayer Identification');

  // IRS subheading
  page.drawText('Request for Taxpayer Identification Number and Certification', {
    x: 36, y, font: bold, size: 11, color: BPN_BLUE,
  });
  y -= 14;
  page.drawText('(As submitted by vendor — for BPN records)', {
    x: 36, y, font: regular, size: 8, color: GRAY,
  });
  y -= 20;

  drawLine(page, 36, y, width - 36, y, rgb(0.7, 0.7, 0.7));
  y -= 18;

  const tin = decrypt(row.tin_encrypted);
  const maskedTin = row.tin_type === 'SSN'
    ? `XXX-XX-${tin.slice(-4)}`
    : `XX-XXXX${tin.slice(-3)}`;

  // Line 1
  drawField(ctx, 'Line 1  Name (as shown on your income tax return)', row.company_name, 36, y, width - 72);
  y -= 30;

  // Line 2
  drawField(ctx, 'Line 2  Business name/disregarded entity name, if different from above', row.dba || '', 36, y, width - 72);
  y -= 30;

  // Line 3 & exemptions
  const taxLabel = taxClassLabel(row.tax_classification)
    + (row.tax_classification === 'llc' ? ` — ${row.tax_classification_llc}` : '')
    + (row.tax_classification === 'other' ? `: ${row.tax_classification_other}` : '');
  drawField(ctx, 'Line 3  Federal tax classification', taxLabel, 36, y, (width - 72) * 0.55);
  drawField(ctx, 'Exempt payee code', row.exempt_payee_code || '', 36 + (width - 72) * 0.57, y, (width - 72) * 0.2);
  drawField(ctx, 'FATCA exemption code', row.exempt_fatca_code || '', 36 + (width - 72) * 0.79, y, (width - 72) * 0.21);
  y -= 30;

  // Address
  drawField(ctx, 'Line 5  Address (number, street, apt. or suite no.)',
    row.address_street + (row.address_apt ? `, ${row.address_apt}` : ''), 36, y, width - 72);
  y -= 30;
  drawField(ctx, 'Line 6  City, state, and ZIP code',
    `${row.address_city}, ${row.address_state} ${row.address_zip}`, 36, y, (width - 72) * 0.7);
  y -= 30;

  y = sectionHeader(ctx, 'Part I — Taxpayer Identification Number (TIN)', y);
  y -= 8;

  page.drawText(
    'Enter your TIN in the appropriate box. For individuals, this is generally your SSN. For other entities, it is your EIN.',
    { x: 36, y, font: regular, size: 8, color: DARK_GRAY }
  );
  y -= 18;

  drawField(ctx, row.tin_type === 'SSN' ? 'Social security number (SSN)' : 'Employer identification number (EIN)',
    maskedTin, 36, y, (width - 72) / 2);
  y -= 30;

  y = sectionHeader(ctx, 'Part II — Certification', y);
  y -= 10;

  const certLines = [
    'Under penalties of perjury, I certify that:',
    '1. The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me);',
    '2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue',
    '   Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me',
    '   that I am no longer subject to backup withholding;',
    '3. I am a U.S. citizen or other U.S. person (defined below); and',
    '4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.',
  ];
  for (const line of certLines) {
    page.drawText(line, { x: 36, y, font: regular, size: 8, color: DARK_GRAY });
    y -= 12;
  }
  y -= 6;

  // Signature block
  drawRect(page, 36, y - 50, width - 72, 60, LIGHT_GRAY, rgb(0.8, 0.8, 0.8));
  page.drawText('SIGNATURE', { x: 44, y: y - 8, font: bold, size: 9, color: BPN_BLUE });
  drawLine(page, 44, y - 22, 300, y - 22, DARK_GRAY, 1);
  page.drawText(row.signature_name, { x: 44, y: y - 20, font: bold, size: 11, color: BLACK });
  page.drawText('Signature (typed)', { x: 44, y: y - 30, font: regular, size: 7, color: GRAY });

  drawLine(page, 310, y - 22, width - 44, y - 22, DARK_GRAY, 1);
  page.drawText(formatDate(row.signature_date), { x: 310, y: y - 20, font: regular, size: 10, color: BLACK });
  page.drawText('Date', { x: 310, y: y - 30, font: regular, size: 7, color: GRAY });

  page.drawText(`Title: ${row.signature_title}`, { x: 44, y: y - 44, font: regular, size: 9, color: DARK_GRAY });

  y -= 70;

  // Footer
  drawLine(page, 36, 50, width - 36, 50, rgb(0.7, 0.7, 0.7));
  page.drawText(`Confirmation #${row.confirmation_number}  |  Submitted ${new Date(row.submitted_at).toLocaleDateString()}  |  Generated by BPN Vendor Portal`, {
    x: 36, y: 36, font: regular, size: 7, color: GRAY,
  });

  return doc.save();
}

// ─── Vendor Setup PDF ──────────────────────────────────────────────────────────
export async function generateVendorSetupPdf(row: SubmissionRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, height };

  let y = pageHeader(ctx, 'Vendor Set Up Form', 'New Vendor Onboarding');

  page.drawText('Please retain for your records. Submitted electronically via BPN Vendor Portal.', {
    x: 36, y, font: regular, size: 8, color: GRAY,
  });
  y -= 20;

  // SECTION 1
  y = sectionHeader(ctx, 'Section 1 — Company & Tax Information', y);
  y -= 8;

  const col1 = 36;
  const col2 = 36 + (width - 72) / 2 + 4;
  const fieldW = (width - 72) / 2 - 4;

  const isCA = row.country === 'CA';

  drawField(ctx, 'Company / Legal Name (PAY-TO)', row.company_name, col1, y, width - 72);
  y -= 30;
  drawField(ctx, 'DBA (Doing Business As)', row.dba || '', col1, y, width - 72);
  y -= 30;

  if (!isCA) {
    const taxLabelStr = taxClassLabel(row.tax_classification)
      + (row.tax_classification === 'llc' ? ` (${row.tax_classification_llc})` : '')
      + (row.tax_classification === 'other' ? `: ${row.tax_classification_other}` : '');
    drawField(ctx, 'Federal Tax Classification', taxLabelStr, col1, y, fieldW);
    drawField(ctx, 'TIN Type', row.tin_type, col2, y, fieldW / 2 - 2);
    drawField(ctx, 'TIN (last 4)', `****${row.tin_last4}`, col2 + fieldW / 2 + 2, y, fieldW / 2 - 2);
    y -= 30;
  } else {
    drawField(ctx, 'Business Number (BN)', `****${row.tin_last4}`, col1, y, fieldW);
    y -= 30;
  }

  const stateColLabel = isCA ? 'Province' : 'State';
  const zipColLabel = isCA ? 'Postal Code' : 'ZIP';
  drawField(ctx, 'Street Address', row.address_street + (row.address_apt ? ` ${row.address_apt}` : ''), col1, y, fieldW);
  drawField(ctx, 'City', row.address_city, col2, y, fieldW * 0.5);
  drawField(ctx, stateColLabel, stateName(row.address_state, row.country), col2 + fieldW * 0.52, y, fieldW * 0.22);
  drawField(ctx, zipColLabel, row.address_zip, col2 + fieldW * 0.76, y, fieldW * 0.24);
  y -= 35;

  // SECTION 2
  y = sectionHeader(ctx, 'Section 2 — Contacts & Remittance', y);
  y -= 8;

  page.drawText('Accounting Contact (or Individual Contact)', { x: col1, y, font: bold, size: 9, color: BPN_BLUE });
  y -= 16;
  drawField(ctx, 'Name', row.accounting_name, col1, y, fieldW);
  drawField(ctx, 'Phone', row.accounting_phone, col2, y, fieldW / 2 - 2);
  drawField(ctx, 'Email', row.accounting_email, col2 + fieldW / 2 + 2, y, fieldW / 2 - 2);
  y -= 30;

  page.drawText('Remit-To Address', { x: col1, y, font: bold, size: 9, color: BPN_BLUE });
  y -= 16;
  if (row.remit_same_as_company) {
    page.drawText('Same as company address above', { x: col1, y, font: regular, size: 9, color: DARK_GRAY });
    y -= 20;
  } else {
    drawField(ctx, 'Street', row.remit_street || '', col1, y, fieldW);
    drawField(ctx, 'City', row.remit_city || '', col2, y, fieldW * 0.5);
    drawField(ctx, 'State', row.remit_state ? stateName(row.remit_state) : '', col2 + fieldW * 0.52, y, fieldW * 0.22);
    drawField(ctx, 'ZIP', row.remit_zip || '', col2 + fieldW * 0.76, y, fieldW * 0.24);
    y -= 30;
  }

  if (row.sales_name) {
    page.drawText('Sales Contact', { x: col1, y, font: bold, size: 9, color: BPN_BLUE });
    y -= 16;
    drawField(ctx, 'Name', row.sales_name, col1, y, fieldW);
    drawField(ctx, 'Phone', row.sales_phone || '', col2, y, fieldW / 2 - 2);
    drawField(ctx, 'Email', row.sales_email || '', col2 + fieldW / 2 + 2, y, fieldW / 2 - 2);
    y -= 30;
  }

  if (row.special_notes) {
    page.drawText('Special Notes', { x: col1, y, font: bold, size: 9, color: BPN_BLUE });
    y -= 14;
    page.drawText(row.special_notes, { x: col1, y, font: regular, size: 9, color: DARK_GRAY, maxWidth: width - 72 });
    y -= 20;
  }

  // SECTION 3 — Signature
  y -= 10;
  y = sectionHeader(ctx, 'Section 3 — Authorization & Signature', y);
  y -= 14;

  drawRect(page, 36, y - 60, width - 72, 72, LIGHT_GRAY, rgb(0.8, 0.8, 0.8));
  page.drawText('Authorized Signature', { x: 44, y: y - 8, font: bold, size: 9, color: BPN_BLUE });
  drawLine(page, 44, y - 24, 300, y - 24, DARK_GRAY, 1);
  page.drawText(row.signature_name, { x: 44, y: y - 22, font: bold, size: 12, color: BLACK });
  page.drawText('Signature (typed)', { x: 44, y: y - 34, font: regular, size: 7, color: GRAY });

  drawLine(page, 310, y - 24, width - 44, y - 24, DARK_GRAY, 1);
  page.drawText(formatDate(row.signature_date), { x: 310, y: y - 22, font: regular, size: 10, color: BLACK });
  page.drawText('Date', { x: 310, y: y - 34, font: regular, size: 7, color: GRAY });

  page.drawText(`Title: ${row.signature_title}   Phone: ${row.signature_phone}`, {
    x: 44, y: y - 50, font: regular, size: 9, color: DARK_GRAY,
  });

  // Footer
  drawLine(page, 36, 50, width - 36, 50, rgb(0.7, 0.7, 0.7));
  page.drawText(`Confirmation #${row.confirmation_number}  |  Submitted ${new Date(row.submitted_at).toLocaleDateString()}  |  BPN Vendor Portal`, {
    x: 36, y: 36, font: regular, size: 7, color: GRAY,
  });

  return doc.save();
}

// ─── ACH Authorization PDF ─────────────────────────────────────────────────────
export async function generateAchPdf(row: SubmissionRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const ctx: DrawContext = { page, bold, regular, width, height };

  const isCA = row.country === 'CA';
  const achTitle = isCA ? 'EFT Payment Authorization' : 'ACH Payment Authorization';

  let y = pageHeader(ctx, achTitle, 'Electronic Funds Transfer');

  page.drawText(`Vendor ${achTitle} Form`, { x: 36, y, font: bold, size: 12, color: BPN_BLUE });
  y -= 18;

  // Authorization terms box
  drawRect(page, 36, y - 90, width - 72, 100, rgb(0.97, 0.98, 1), rgb(0.7, 0.8, 1));
  page.drawText('AUTHORIZATION TERMS', { x: 44, y: y - 10, font: bold, size: 9, color: BPN_BLUE });
  const achType = isCA ? 'EFT' : 'ACH';
  const terms = [
    '• I authorize Bare Performance Nutrition to deposit payments to my financial institution electronically.',
    '• I understand that BPN will reverse any payments made to my account in error.',
    '• The company/individual will give 30 days advanced written notice of any changes in the depository financial institution.',
    '• I understand BPN will charge a fee for any/all returned items due to failure to notify BPN of updated information.',
    `• ${achType} payments are processed once a week. Payment will be scheduled after the required information has been received`,
    '  and internal approvals have been obtained.',
  ];
  let ty = y - 24;
  for (const term of terms) {
    page.drawText(term, { x: 44, y: ty, font: regular, size: 8, color: DARK_GRAY });
    ty -= 12;
  }
  y -= 106;

  const col1 = 36;
  const col2 = 36 + (width - 72) / 2 + 4;
  const fieldW = (width - 72) / 2 - 4;

  y = sectionHeader(ctx, 'Banking Information', y);
  y -= 8;

  drawField(ctx, 'Financial Institution Name', row.bank_name, col1, y, fieldW);
  drawField(ctx, 'Name on Account', row.bank_account_name, col2, y, fieldW);
  y -= 30;

  const bankStateLabel = isCA ? 'Province' : 'State';
  const bankZipLabel = isCA ? 'Postal Code' : 'ZIP';
  drawField(ctx, 'Bank Street Address', row.bank_address_street, col1, y, fieldW);
  drawField(ctx, 'City', row.bank_address_city, col2, y, fieldW * 0.5);
  drawField(ctx, bankStateLabel, stateName(row.bank_address_state, row.country), col2 + fieldW * 0.52, y, fieldW * 0.22);
  drawField(ctx, bankZipLabel, row.bank_address_zip, col2 + fieldW * 0.76, y, fieldW * 0.24);
  y -= 30;

  drawField(ctx, 'Account Number', `••••••••${row.bank_account_last4}`, col1, y, fieldW);
  if (isCA) {
    drawField(ctx, 'Transit Number', row.ca_transit_number ?? '', col2, y, fieldW / 2 - 2);
    drawField(ctx, 'Institution Number', row.ca_institution_number ?? '', col2 + fieldW / 2 + 2, y, fieldW / 2 - 2);
  } else {
    drawField(ctx, 'ABA Routing Number', row.bank_routing_number, col2, y, fieldW);
  }
  y -= 30;

  drawField(ctx, 'Email Address for Payment Notifications', row.payment_notification_email, col1, y, width - 72);
  y -= 35;

  // Signature
  y -= 6;
  y = sectionHeader(ctx, 'Signature & Authorization', y);
  y -= 14;

  drawRect(page, 36, y - 70, width - 72, 82, LIGHT_GRAY, rgb(0.8, 0.8, 0.8));
  page.drawText(`By signing below, I authorize the ${achType} payment terms described above.`, {
    x: 44, y: y - 10, font: regular, size: 9, color: DARK_GRAY,
  });
  drawLine(page, 44, y - 28, 300, y - 28, DARK_GRAY, 1);
  page.drawText(row.signature_name, { x: 44, y: y - 26, font: bold, size: 12, color: BLACK });
  page.drawText('Authorized Signature (typed)', { x: 44, y: y - 38, font: regular, size: 7, color: GRAY });

  drawLine(page, 310, y - 28, width - 44, y - 28, DARK_GRAY, 1);
  page.drawText(formatDate(row.signature_date), { x: 310, y: y - 26, font: regular, size: 10, color: BLACK });
  page.drawText('Date', { x: 310, y: y - 38, font: regular, size: 7, color: GRAY });

  page.drawText(`Title: ${row.signature_title}`, { x: 44, y: y - 52, font: regular, size: 9, color: DARK_GRAY });
  page.drawText(`Phone: ${row.signature_phone}`, { x: 44, y: y - 64, font: regular, size: 9, color: DARK_GRAY });

  // Footer
  drawLine(page, 36, 50, width - 36, 50, rgb(0.7, 0.7, 0.7));
  page.drawText(`Confirmation #${row.confirmation_number}  |  Submitted ${new Date(row.submitted_at).toLocaleDateString()}  |  BPN Vendor Portal`, {
    x: 36, y: 36, font: regular, size: 7, color: GRAY,
  });

  return doc.save();
}

// ─── Merged PDF ────────────────────────────────────────────────────────────────
export async function generateMergedPdf(row: SubmissionRow): Promise<Uint8Array> {
  const isCA = row.country === 'CA';

  // W-9 is a US-only document; skip it for Canadian vendors
  const pdfPromises = isCA
    ? [generateVendorSetupPdf(row), generateAchPdf(row)]
    : [generateW9Pdf(row), generateVendorSetupPdf(row), generateAchPdf(row)];

  const pdfResults = await Promise.all(pdfPromises);
  const merged = await PDFDocument.create();

  for (const bytes of pdfResults) {
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }

  return merged.save();
}
