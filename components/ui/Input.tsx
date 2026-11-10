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
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={cn(
          'transition-smooth focus-ring',
          'thumb-zone w-full rounded-btn border bg-white px-3.5 text-[16px] sm:text-sm text-ink',
          'placeholder:text-slate-400',
          'focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
          className
        )}
      />
      {error && <p className="mt-1.5 text-[13px] text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

