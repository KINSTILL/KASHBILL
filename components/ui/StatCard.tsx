import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: 'sage' | 'brass' | 'terracotta' | 'ink';
  className?: string;
};

const ACCENT_CLASSES: Record<NonNullable<Props['accent']>, string> = {
  sage: 'bg-sage-50 text-sage-700',
  brass: 'bg-[#FBF3E5] text-brass-dark',
  terracotta: 'bg-[#FBEEE8] text-terracotta',
  ink: 'bg-slate-100 text-ink',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'sage',
  className,
}: Props) {
  return (
    <div className={cn('surface p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <div className="mt-1.5 text-[20px] font-bold leading-tight text-ink">{value}</div>
          {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base',
              ACCENT_CLASSES[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

