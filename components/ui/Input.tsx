'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, helperText, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name ?? `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={cn(
          'thumb-zone w-full rounded-lg border bg-slate-50 px-3 text-base text-slate-900',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2',
          error ? 'border-error focus:border-error focus:ring-red-100' : 'border-slate-300 focus:border-sage-500 focus:ring-sage-100',
          className
        )}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

