'use client';

import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, error, required, hint, children, className }: Props) {
  return (
    <div className={className}>
      <label className="form-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500 mb-1">{hint}</p>}
      {children}
      {error && (
        <p className="form-error">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={clsx('form-input', error && 'form-input-error', className)}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx('form-select', error && 'form-input-error', className)}
      {...props}
    >
      {children}
    </select>
  );
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export function TextArea({ error, className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={clsx('form-input', error && 'form-input-error', className)}
      rows={3}
      {...props}
    />
  );
}
