import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getAllSubmissions, getStatusCounts } from '@/lib/db';
import AdminNav from '@/components/admin/AdminNav';
import SubmissionsTable from '@/components/admin/SubmissionsTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — BPN Admin' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  if (!(await isAuthenticated())) redirect('/admin');

  const rows = await getAllSubmissions({
    status: searchParams.status && searchParams.status !== 'all' ? searchParams.status : undefined,
    q: searchParams.q,
  });

  const statusCounts = await getStatusCounts();
  const totalCount = statusCounts.all ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vendor Submissions</h1>
            <p className="text-sm text-slate-500">{totalCount} total submission{totalCount !== 1 ? 's' : ''}</p>
          </div>
          <a href="/api/admin/export" className="btn-secondary text-sm">
            Export CSV
          </a>
        </div>

        <SubmissionsTable
          rows={rows}
          statusCounts={statusCounts}
          currentStatus={searchParams.status}
          currentQ={searchParams.q}
        />
      </main>
    </div>
  );
}
