'use client';

import { cn } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import { Spinner } from './Spinner';
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  loading,
  fullWidth,
  hapticFeedback = true,
  className,
  children,
  disabled,
  onClick,
  ...rest
}: Props) {
  const effectiveLoading = isLoading || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback) haptic('light');
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      disabled={disabled || effectiveLoading}
      className={cn(
        'ripple inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        {
          'bg-sage-500 text-white hover:bg-sage-700 focus-visible:ring-sage-500': variant === 'primary',
          'bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-800': variant === 'secondary',
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400': variant === 'outline',
          'bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400': variant === 'ghost',
          'bg-error text-white hover:bg-red-700 focus-visible:ring-error': variant === 'danger',
          'bg-whatsapp text-white hover:bg-whatsapp-dark focus-visible:ring-whatsapp': variant === 'whatsapp',
          'h-9 px-3 text-sm': size === 'sm',
          'thumb-zone h-12 px-4 text-base': size === 'md',
          'thumb-zone-lg h-[54px] px-6 text-lg': size === 'lg',
          'w-full': fullWidth,
        },
        className
      )}
    >
      {effectiveLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
