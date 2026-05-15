'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Building2, Calendar, ChevronRight } from 'lucide-react';
import type { SubmissionRow } from '@/lib/db';
import clsx from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  'Pending Review': 'Pending Review',
  'Approved': 'Approved',
  'Needs Correction': 'Needs Correction',
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Approved' ? 'badge-approved' :
    status === 'Needs Correction' ? 'badge-correction' :
    'badge-pending';
  return <span className={cls}>{status}</span>;
}

type Props = {
  rows: SubmissionRow[];
  statusCounts: Record<string, number>;
  currentStatus?: string;
  currentQ?: string;
};

export default function SubmissionsTable({ rows, statusCounts, currentStatus, currentQ }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ ?? '');

  function applyFilter(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('q', search);
    router.push('/admin/dashboard?' + params.toString());
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter(currentStatus, q)}
            placeholder="Search company, confirmation #…"
            className="form-input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Pending Review', 'Approved', 'Needs Correction'] as const).map(s => (
            <button
              key={s}
              onClick={() => applyFilter(s === 'all' ? undefined : s, q)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors',
                (currentStatus === s || (!currentStatus && s === 'all'))
                  ? 'bg-bpn-600 border-bpn-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              )}
            >
              {s === 'all' ? 'All' : s}
              {' '}
              <span className="opacity-70">({statusCounts[s] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">TIN (last 4)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.company_name}</p>
                      {row.dba && <p className="text-xs text-slate-500">DBA: {row.dba}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {row.country === 'CA' ? '🇨🇦 CA' : '🇺🇸 US'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {row.tin_type} ****{row.tin_last4}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.confirmation_number}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(row.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/submission/${row.id}`}
                        className="flex items-center gap-1 text-bpn-600 hover:text-bpn-700 font-medium text-xs"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
