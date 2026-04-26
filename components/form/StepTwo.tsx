'use client';

import { FormField, Input, Select, TextArea } from './FormField';
import { US_STATES } from '@/lib/constants';
import type { FormData } from '@/lib/validation';

type Props = {
  data: FormData;
  onChange: (field: keyof FormData, value: unknown) => void;
  errors: Partial<Record<keyof FormData, string>>;
};

export default function StepTwo({ data, onChange, errors }: Props) {
  return (
    <div className="space-y-8">
      {/* Accounting Contact */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Accounting Contact (or Individual Contact)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Full Name" required error={errors.accounting_name}>
            <Input
              value={data.accounting_name}
              onChange={e => onChange('accounting_name', e.target.value)}
              placeholder="Contact name"
              error={errors.accounting_name}
            />
          </FormField>
          <FormField label="Phone" required error={errors.accounting_phone}>
            <Input
              value={data.accounting_phone}
              onChange={e => onChange('accounting_phone', e.target.value)}
              placeholder="(555) 555-5555"
              inputMode="tel"
              error={errors.accounting_phone}
            />
          </FormField>
          <FormField label="Email" required error={errors.accounting_email}>
            <Input
              value={data.accounting_email}
              onChange={e => onChange('accounting_email', e.target.value)}
              placeholder="contact@company.com"
              inputMode="email"
              error={errors.accounting_email}
            />
          </FormField>
        </div>
      </div>

      {/* Remit-to Address */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Remit-To Address</h3>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.remit_same_as_company}
            onChange={e => onChange('remit_same_as_company', e.target.checked)}
            className="h-4 w-4 rounded text-bpn-600 focus:ring-bpn-500 border-slate-300"
          />
          <span className="text-sm text-slate-700">Same as company address from Step 1</span>
        </label>

        {!data.remit_same_as_company && (
          <div className="space-y-3 pt-1">
            <FormField label="Street Address" required error={errors.remit_street}>
              <Input
                value={data.remit_street}
                onChange={e => onChange('remit_street', e.target.value)}
                placeholder="123 Main Street"
                error={errors.remit_street}
              />
            </FormField>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="City" required error={errors.remit_city} className="col-span-2">
                <Input
                  value={data.remit_city}
                  onChange={e => onChange('remit_city', e.target.value)}
                  placeholder="City"
                  error={errors.remit_city}
                />
              </FormField>
              <FormField label="State" required error={errors.remit_state}>
                <Select
                  value={data.remit_state}
                  onChange={e => onChange('remit_state', e.target.value)}
                  error={errors.remit_state}
                >
                  <option value="">Select…</option>
                  {US_STATES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="ZIP Code" required error={errors.remit_zip}>
                <Input
                  value={data.remit_zip}
                  onChange={e => onChange('remit_zip', e.target.value)}
                  placeholder="00000"
                  maxLength={10}
                  inputMode="numeric"
                  error={errors.remit_zip}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Sales Contact — optional */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Sales Contact
          <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Full Name" error={errors.sales_name}>
            <Input
              value={data.sales_name}
              onChange={e => onChange('sales_name', e.target.value)}
              placeholder="Contact name"
              error={errors.sales_name}
            />
          </FormField>
          <FormField label="Phone" error={errors.sales_phone}>
            <Input
              value={data.sales_phone}
              onChange={e => onChange('sales_phone', e.target.value)}
              placeholder="(555) 555-5555"
              inputMode="tel"
              error={errors.sales_phone}
            />
          </FormField>
          <FormField label="Email" error={errors.sales_email}>
            <Input
              value={data.sales_email}
              onChange={e => onChange('sales_email', e.target.value)}
              placeholder="sales@company.com"
              inputMode="email"
              error={errors.sales_email}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Special Notes" hint="Any special payment or communication instructions (optional)">
        <TextArea
          value={data.special_notes}
          onChange={e => onChange('special_notes', e.target.value)}
          placeholder="Optional notes for BPN accounting…"
        />
      </FormField>
    </div>
  );
}
