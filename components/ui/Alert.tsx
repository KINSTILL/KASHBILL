'use client';

import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: 'border-slate-300 bg-slate-50 text-slate-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
};

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

