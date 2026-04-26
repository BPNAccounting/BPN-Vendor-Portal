import { Lock, ShieldCheck } from 'lucide-react';
import VendorForm from '@/components/form/VendorForm';

export const metadata = {
  title: 'Vendor Onboarding — Bare Performance Nutrition',
};

export default function FormPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-bpn-950 text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bpn-logo.png" alt="BPN" className="h-8 w-auto" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Bare Performance Nutrition</p>
              <p className="text-sm font-semibold leading-tight">Vendor Onboarding Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure Form</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-xl border border-bpn-200 bg-bpn-50 px-5 py-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-bpn-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-bpn-900">Complete your vendor onboarding in one step</p>
            <p className="text-xs text-bpn-700 mt-0.5">
              This form combines your W-9 tax information, vendor set-up details, and ACH payment authorization. All information is collected securely and used solely for vendor onboarding and tax reporting purposes. Sensitive data is encrypted before storage.
            </p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <VendorForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Questions? Contact BPN Accounting at{' '}
          <a href="mailto:accounting@bpnsupps.com" className="text-bpn-600 hover:underline">
            accounting@bpnsupps.com
          </a>
        </p>
      </main>
    </div>
  );
}
