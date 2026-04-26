'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import ProgressBar from './ProgressBar';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import StepFour from './StepFour';
import { initialFormData, step1Schema, step2Schema, step3Schema, step4Schema } from '@/lib/validation';
import type { FormData } from '@/lib/validation';

const STEP_TITLES = [
  { title: 'Company & Tax Information', sub: 'W-9 and vendor identity — used for tax filing and payment setup' },
  { title: 'Contacts & Remittance', sub: 'Who BPN will contact and where to send payments' },
  { title: 'ACH Payment Authorization', sub: 'Banking details for electronic payment setup' },
  { title: 'Review & Sign', sub: 'Confirm your information and provide your electronic signature' },
];

export default function VendorForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function updateField(field: keyof FormData, value: unknown) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  function validateStep(stepNum: number): boolean {
    const schemas: Record<number, typeof step1Schema> = {
      1: step1Schema,
      2: step2Schema as typeof step1Schema,
      3: step3Schema as typeof step1Schema,
      4: step4Schema as typeof step1Schema,
    };
    const schema = schemas[stepNum];
    const result = schema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FormData;
      if (key && !newErrors[key]) newErrors[key] = issue.message;
    }
    setErrors(newErrors);
    // Scroll to first error
    setTimeout(() => {
      const el = document.querySelector('[class*="form-input-error"], [class*="border-red"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return false;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function prevStep() {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToStep(s: number) {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Submission failed. Please try again.');
      }

      const { confirmationNumber } = await res.json();
      router.push(`/form/success?ref=${confirmationNumber}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepInfo = STEP_TITLES[step - 1];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-8">
        <ProgressBar currentStep={step} />
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-bpn-600 mb-1">
          Step {step} of 4
        </p>
        <h2 className="text-xl font-bold text-slate-900">{stepInfo.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{stepInfo.sub}</p>
      </div>

      <div className="min-h-[400px]">
        {step === 1 && <StepOne data={formData} onChange={updateField} errors={errors} />}
        {step === 2 && <StepTwo data={formData} onChange={updateField} errors={errors} />}
        {step === 3 && <StepThree data={formData} onChange={updateField} errors={errors} />}
        {step === 4 && <StepFour data={formData} onChange={updateField} errors={errors} onEdit={goToStep} />}
      </div>

      {submitError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
        <div>
          {step > 1 && (
            <button type="button" onClick={prevStep} className="btn-secondary" disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
        <div>
          {step < 4 ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[160px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Form
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
