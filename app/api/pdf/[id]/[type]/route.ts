import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSubmissionById } from '@/lib/db';
import { generateW9Pdf, generateVendorSetupPdf, generateAchPdf, generateMergedPdf } from '@/lib/pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = getSubmissionById(params.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let pdfBytes: Uint8Array;
  let filename: string;

  switch (params.type) {
    case 'w9':
      if (row.country === 'CA') {
        return NextResponse.json(
          { error: 'W-9 is not applicable for Canadian vendors' },
          { status: 400 }
        );
      }
      pdfBytes = await generateW9Pdf(row);
      filename = `W9-${row.confirmation_number}.pdf`;
      break;
    case 'vendor-setup':
      pdfBytes = await generateVendorSetupPdf(row);
      filename = `VendorSetup-${row.confirmation_number}.pdf`;
      break;
    case 'ach':
      pdfBytes = await generateAchPdf(row);
      filename = `ACH-${row.confirmation_number}.pdf`;
      break;
    case 'all':
      pdfBytes = await generateMergedPdf(row);
      filename = `BPN-Complete-${row.confirmation_number}.pdf`;
      break;
    default:
      return NextResponse.json({ error: 'Unknown PDF type' }, { status: 400 });
  }

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
