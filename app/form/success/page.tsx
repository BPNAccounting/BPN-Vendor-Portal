import { CheckCircle2, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Submission Received — BPN Vendor Portal' };

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref ?? 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-bpn-950 text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-3">
          <img src="/bpn-logo.png" alt="BPN" className="h-8 w-auto" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Bare Performance Nutrition</p>
            <p className="text-sm font-semibold leading-tight">Vendor Onboarding Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="card max-w-lg w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h1>
          <p className="text-slate-600 mb-6">
            Thank you for completing the BPN vendor onboarding form. Your information has been submitted securely.
          </p>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-5 py-4 mb-6">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Confirmation Number</p>
            <p className="text-2xl font-mono font-bold text-bpn-600 tracking-widest">{ref}</p>
            <p className="text-xs text-slate-400 mt-1">Save this number for your records</p>
          </div>

          <div className="space-y-3 text-left mb-8">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-bpn-500 mt-0.5 shrink-0" />
              <span>BPN accounting will review your submission. You will be contacted if any corrections are needed.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-bpn-500 mt-0.5 shrink-0" />
              <span>
                For questions, contact{' '}
                <a href="mailto:accounting@bpnsupps.com" className="text-bpn-600 hover:underline font-medium">
                  accounting@bpnsupps.com
                </a>{' '}
                and reference your confirmation number.
              </span>
            </div>
          </div>

          <Link href="/form" className="btn-secondary text-sm">
            Submit another response
          </Link>
        </div>
      </main>
    </div>
  );
}
