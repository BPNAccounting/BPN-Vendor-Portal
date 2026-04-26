import { redirect, notFound } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSubmissionById } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import AdminNav from '@/components/admin/AdminNav';
import SubmissionDetail from '@/components/admin/SubmissionDetail';

export const dynamic = 'force-dynamic';

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) redirect('/admin');

  const row = await getSubmissionById(params.id);
  if (!row) notFound();

  const tin = decrypt(row.tin_encrypted);
  const accountNumber = row.bank_account_number_encrypted
    ? decrypt(row.bank_account_number_encrypted)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <SubmissionDetail row={row} tin={tin} accountNumber={accountNumber} />
      </main>
    </div>
  );
}
