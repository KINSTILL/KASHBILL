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
        'transition-smooth focus-ring ripple rounded-btn',
        'inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.01em]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100',
        'active:scale-[0.98]',
        {
          'bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800 shadow-sm':
            variant === 'primary',
          'bg-white text-ink border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm':
            variant === 'secondary',
          'border border-slate-300 bg-white text-ink hover:bg-slate-50': variant === 'outline',
          'bg-transparent text-ink hover:bg-slate-100 active:bg-slate-200': variant === 'ghost',
          'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 hover:shadow-md':
            variant === 'danger',
          'bg-gradient-to-b from-whatsapp to-whatsapp-dark text-white shadow-sm hover:shadow-md':
            variant === 'whatsapp',
        },
        {
          'h-9 px-3 text-sm': size === 'sm',
          'thumb-zone h-10 px-4 text-sm rounded-lg font-medium': size === 'md',
          'thumb-zone-lg h-11 px-5 text-sm rounded-xl font-semibold': size === 'lg',
        },
        fullWidth && 'w-full',
        className
      )}
    >
      {effectiveLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

