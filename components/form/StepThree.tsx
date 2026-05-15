'use client';

import { ShieldCheck } from 'lucide-react';
import { FormField, Input, Select } from './FormField';
import MaskedInput from './MaskedInput';
import { US_STATES, CA_PROVINCES } from '@/lib/constants';
import type { FormData } from '@/lib/validation';

type Props = {
  data: FormData;
  onChange: (field: keyof FormData, value: unknown) => void;
  errors: Partial<Record<keyof FormData, string>>;
};

function formatPostal(value: string, country: 'US' | 'CA'): string {
  if (country !== 'CA') return value;
  const clean = value.replace(/\s/g, '').toUpperCase();
  if (clean.length > 3) return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
  return clean;
}

export default function StepThree({ data, onChange, errors }: Props) {
  const isCA = data.country === 'CA';
  const regions = isCA ? CA_PROVINCES : US_STATES;

  return (
    <div className="space-y-6">
      {/* Authorization terms */}
      <div className="rounded-lg border border-bpn-200 bg-bpn-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-bpn-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-bpn-800 mb-2">ACH / EFT Payment Authorization Terms</p>
            <ul className="space-y-1.5 text-sm text-bpn-700">
              <li>• I authorize Bare Performance Nutrition to deposit payments to my financial institution electronically.</li>
              <li>• I understand that BPN will reverse any payments made to my account in error.</li>
              <li>• The company/individual will give 30 days advanced written notice of any changes in the depository financial institution.</li>
              <li>• I understand BPN will charge a fee for any/all returned items due to failure to notify BPN of updated information.</li>
              <li>• Payments are processed once a week. Payment will be scheduled after the required information has been received and internal approvals have been obtained.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Financial institution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Financial Institution Name" required error={errors.bank_name}>
          <Input
            value={data.bank_name}
            onChange={e => onChange('bank_name', e.target.value)}
            placeholder="Bank or credit union name"
            error={errors.bank_name}
          />
        </FormField>
        <FormField label="Name on Account" required error={errors.bank_account_name}>
          <Input
            value={data.bank_account_name}
            onChange={e => onChange('bank_account_name', e.target.value)}
            placeholder="Exact name on the bank account"
            error={errors.bank_account_name}
          />
        </FormField>
      </div>

      {/* Bank address */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Bank Address</h3>
        <FormField label="Street Address" required error={errors.bank_address_street}>
          <Input
            value={data.bank_address_street}
            onChange={e => onChange('bank_address_street', e.target.value)}
            placeholder="Bank street address"
            error={errors.bank_address_street}
          />
        </FormField>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormField label="City" required error={errors.bank_address_city} className="col-span-2">
            <Input
              value={data.bank_address_city}
              onChange={e => onChange('bank_address_city', e.target.value)}
              placeholder="City"
              error={errors.bank_address_city}
            />
          </FormField>
          <FormField label={isCA ? 'Province' : 'State'} required error={errors.bank_address_state}>
            <Select
              value={data.bank_address_state}
              onChange={e => onChange('bank_address_state', e.target.value)}
              error={errors.bank_address_state}
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
            error={errors.bank_address_zip}
            hint={isCA ? 'A1A 1A1' : undefined}
          >
            <Input
              value={data.bank_address_zip}
              onChange={e => onChange('bank_address_zip', formatPostal(e.target.value, data.country))}
              placeholder={isCA ? 'A1A 1A1' : '00000'}
              maxLength={isCA ? 7 : 10}
              inputMode={isCA ? 'text' : 'numeric'}
              error={errors.bank_address_zip}
            />
          </FormField>
        </div>
      </div>

      {/* Account + routing/transit details */}
      {isCA ? (
        /* ── Canadian banking ── */
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <strong>Canadian EFT format:</strong> Transit number (5 digits) + Institution number (3 digits) + Account number. These are printed on a void cheque.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Transit Number"
              required
              error={errors.ca_transit_number}
              hint="5 digits — branch identifier"
            >
              <Input
                value={data.ca_transit_number}
                onChange={e => onChange('ca_transit_number', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="00000"
                maxLength={5}
                inputMode="numeric"
                error={errors.ca_transit_number}
              />
            </FormField>
            <FormField
              label="Institution Number"
              required
              error={errors.ca_institution_number}
              hint="3 digits — bank identifier"
            >
              <Input
                value={data.ca_institution_number}
                onChange={e => onChange('ca_institution_number', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="000"
                maxLength={3}
                inputMode="numeric"
                error={errors.ca_institution_number}
              />
            </FormField>
            <FormField
              label="Account Number"
              required
              error={errors.bank_account_number}
              hint="Click eye to reveal / hide"
            >
              <MaskedInput
                value={data.bank_account_number}
                onChange={v => onChange('bank_account_number', v.replace(/\D/g, ''))}
                placeholder="Account number"
                error={errors.bank_account_number}
                maxLength={12}
                inputMode="numeric"
              />
            </FormField>
          </div>
        </div>
      ) : (
        /* ── US banking ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Bank Account Number"
            required
            error={errors.bank_account_number}
            hint="Click the eye icon to reveal / hide"
          >
            <MaskedInput
              value={data.bank_account_number}
              onChange={v => onChange('bank_account_number', v.replace(/\D/g, ''))}
              placeholder="Account number"
              error={errors.bank_account_number}
              maxLength={17}
              inputMode="numeric"
            />
          </FormField>
          <FormField
            label="Bank ABA Routing Number (9 digits)"
            required
            error={errors.bank_routing_number}
          >
            <Input
              value={data.bank_routing_number}
              onChange={e => onChange('bank_routing_number', e.target.value.replace(/\D/g, ''))}
              placeholder="000000000"
              maxLength={9}
              inputMode="numeric"
              error={errors.bank_routing_number}
            />
          </FormField>
        </div>
      )}

      <FormField label="Email Address for Payment Notifications" required error={errors.payment_notification_email}>
        <Input
          value={data.payment_notification_email}
          onChange={e => onChange('payment_notification_email', e.target.value)}
          placeholder="ap@yourcompany.com"
          inputMode="email"
          error={errors.payment_notification_email}
        />
      </FormField>
    </div>
  );
}
