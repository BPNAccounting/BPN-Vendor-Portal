'use client';

import { FormField, Input, Select } from './FormField';
import MaskedInput from './MaskedInput';
import { US_STATES, CA_PROVINCES, TAX_CLASSIFICATIONS } from '@/lib/constants';
import type { FormData } from '@/lib/validation';

type Props = {
  data: FormData;
  onChange: (field: keyof FormData, value: unknown) => void;
  errors: Partial<Record<keyof FormData, string>>;
};

function formatTin(value: string, type: 'SSN' | 'EIN' | 'BN'): string {
  const digits = value.replace(/\D/g, '');
  if (type === 'SSN') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }
  if (type === 'EIN') {
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  }
  // BN: plain 9 digits, no formatting
  return digits.slice(0, 9);
}

function formatPostal(value: string, country: 'US' | 'CA'): string {
  if (country !== 'CA') return value;
  // Auto-insert space after 3rd char for Canadian postal (A1A 1A1)
  const clean = value.replace(/\s/g, '').toUpperCase();
  if (clean.length > 3) return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
  return clean;
}

export default function StepOne({ data, onChange, errors }: Props) {
  const isCA = data.country === 'CA';
  const regions = isCA ? CA_PROVINCES : US_STATES;

  function handleCountryChange(newCountry: 'US' | 'CA') {
    onChange('country', newCountry);
    // Reset country-specific fields to avoid stale values
    onChange('address_state', '');
    onChange('address_zip', '');
    onChange('tin_type', newCountry === 'CA' ? 'BN' : 'EIN');
    onChange('tin', '');
    onChange('tax_classification', '');
    onChange('tax_classification_llc', '');
  }

  function handleTinInput(raw: string) {
    onChange('tin', formatTin(raw, data.tin_type));
  }

  return (
    <div className="space-y-6">
      {/* ── Country Toggle ── */}
      <div>
        <p className="form-label mb-2">Vendor Country <span className="text-red-500">*</span></p>
        <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden shadow-sm">
          {(['US', 'CA'] as const).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => handleCountryChange(c)}
              className={[
                'px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors',
                data.country === c
                  ? 'bg-bpn-950 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="text-base">{c === 'US' ? '🇺🇸' : '🇨🇦'}</span>
              {c === 'US' ? 'United States' : 'Canada'}
            </button>
          ))}
        </div>
        {isCA && (
          <p className="mt-2 text-xs text-slate-500">
            Canadian vendors: W-9 certification is not required. Please provide your Canadian Business Number (BN) and Canadian banking details.
          </p>
        )}
      </div>

      {/* ── Company Name ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Company / Legal Name (PAY-TO)" required error={errors.company_name}>
          <Input
            value={data.company_name}
            onChange={e => onChange('company_name', e.target.value)}
            placeholder="Legal entity name"
            error={errors.company_name}
          />
        </FormField>
        <FormField label="DBA (Doing Business As)" hint="If different from legal name">
          <Input
            value={data.dba}
            onChange={e => onChange('dba', e.target.value)}
            placeholder="Trade name (optional)"
          />
        </FormField>
      </div>

      {/* ── Tax Classification (US only) ── */}
      {!isCA && (
        <>
          <FormField label="Federal Tax Classification" required error={errors.tax_classification}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {TAX_CLASSIFICATIONS.map(tc => (
                <label key={tc.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="tax_classification"
                    value={tc.value}
                    checked={data.tax_classification === tc.value}
                    onChange={() => onChange('tax_classification', tc.value)}
                    className="h-4 w-4 text-bpn-600 focus:ring-bpn-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">{tc.label}</span>
                </label>
              ))}
            </div>
            {errors.tax_classification && (
              <p className="form-error mt-2">{errors.tax_classification}</p>
            )}
          </FormField>

          {data.tax_classification === 'llc' && (
            <FormField label="LLC tax classification" required error={errors.tax_classification_llc}
              hint="Enter C, S, or P for the tax classification of the single-member owner">
              <div className="flex gap-4 mt-1">
                {['C', 'S', 'P'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llc_type"
                      value={v}
                      checked={data.tax_classification_llc === v}
                      onChange={() => onChange('tax_classification_llc', v)}
                      className="h-4 w-4 text-bpn-600 focus:ring-bpn-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{v}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          {data.tax_classification === 'other' && (
            <FormField label="Describe the other classification" required error={errors.tax_classification_other}>
              <Input
                value={data.tax_classification_other}
                onChange={e => onChange('tax_classification_other', e.target.value)}
                placeholder="Please describe"
                error={errors.tax_classification_other}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Exempt payee code" hint="If applicable (see IRS W-9 instructions)">
              <Input
                value={data.exempt_payee_code}
                onChange={e => onChange('exempt_payee_code', e.target.value)}
                placeholder="Code (optional)"
              />
            </FormField>
            <FormField label="Exemption from FATCA reporting code" hint="If applicable">
              <Input
                value={data.exempt_fatca_code}
                onChange={e => onChange('exempt_fatca_code', e.target.value)}
                placeholder="Code (optional)"
              />
            </FormField>
          </div>
        </>
      )}

      {/* ── Address ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Business Address</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Street Address" required error={errors.address_street} className="col-span-2">
              <Input
                value={data.address_street}
                onChange={e => onChange('address_street', e.target.value)}
                placeholder="123 Main Street"
                error={errors.address_street}
              />
            </FormField>
            <FormField label="Apt / Suite / Unit">
              <Input
                value={data.address_apt}
                onChange={e => onChange('address_apt', e.target.value)}
                placeholder="Ste 100"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="City" required error={errors.address_city} className="col-span-2">
              <Input
                value={data.address_city}
                onChange={e => onChange('address_city', e.target.value)}
                placeholder="City"
                error={errors.address_city}
              />
            </FormField>
            <FormField label={isCA ? 'Province / Territory' : 'State'} required error={errors.address_state}>
              <Select
                value={data.address_state}
                onChange={e => onChange('address_state', e.target.value)}
                error={errors.address_state}
              >
                <option value="">Select…</option>
                {regions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField
              label={isCA ? 'Postal Code' : 'ZIP Code'}
              required
              error={errors.address_zip}
              hint={isCA ? 'e.g. A1A 1A1' : undefined}
            >
              <Input
                value={data.address_zip}
                onChange={e => onChange('address_zip', formatPostal(e.target.value, data.country))}
                placeholder={isCA ? 'A1A 1A1' : '00000'}
                maxLength={isCA ? 7 : 10}
                inputMode={isCA ? 'text' : 'numeric'}
                error={errors.address_zip}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* ── TIN / Business Number ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          {isCA ? 'Canada Revenue Agency Number' : 'Taxpayer Identification Number (TIN)'}
        </h3>

        {/* US: SSN or EIN toggle */}
        {!isCA && (
          <div className="flex gap-6 mb-3">
            {(['SSN', 'EIN'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tin_type"
                  value={type}
                  checked={data.tin_type === type}
                  onChange={() => { onChange('tin_type', type); onChange('tin', ''); }}
                  className="h-4 w-4 text-bpn-600 focus:ring-bpn-500 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  {type === 'SSN' ? 'SSN (Social Security Number)' : 'EIN (Employer ID Number)'}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* CA: BN only (no toggle needed) */}
        {isCA && (
          <input type="hidden" value="BN" />
        )}

        <FormField
          label={
            isCA
              ? 'Business Number (BN)'
              : data.tin_type === 'SSN'
                ? 'Social Security Number'
                : 'Employer Identification Number'
          }
          required
          error={errors.tin}
          hint={
            isCA
              ? '9-digit CRA Business Number — e.g. 123456789'
              : data.tin_type === 'SSN'
                ? 'Format: XXX-XX-XXXX'
                : 'Format: XX-XXXXXXX'
          }
        >
          <MaskedInput
            value={data.tin}
            onChange={handleTinInput}
            placeholder={isCA ? '123456789' : data.tin_type === 'SSN' ? '000-00-0000' : '00-0000000'}
            error={errors.tin}
            maxLength={isCA ? 9 : data.tin_type === 'SSN' ? 11 : 10}
            inputMode="numeric"
          />
        </FormField>
      </div>
    </div>
  );
}
