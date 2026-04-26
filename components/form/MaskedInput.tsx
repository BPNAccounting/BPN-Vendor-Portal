'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  pattern?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
};

export default function MaskedInput({ value, onChange, placeholder, error, maxLength, pattern, inputMode }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <input
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        autoComplete="off"
        className={clsx('form-input pr-10', error && 'form-input-error')}
      />
      <button
        type="button"
        onClick={() => setRevealed(r => !r)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
        aria-label={revealed ? 'Hide value' : 'Show value'}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
