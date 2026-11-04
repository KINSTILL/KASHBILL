import { cn } from '@/lib/utils';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'pro' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        {
          'px-2 py-0.5 text-xs': size === 'md',
          'px-1.5 py-0.2 text-[10px]': size === 'sm',
        },
        {
          'bg-slate-100 text-slate-700': variant === 'default' || variant === 'neutral',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-orange-100 text-orange-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'danger',
          'bg-amber-100 text-amber-800': variant === 'pro',
          'bg-blue-100 text-blue-800': variant === 'info',
        }
      )}
    >
      {children}
    </span>
  );
}
