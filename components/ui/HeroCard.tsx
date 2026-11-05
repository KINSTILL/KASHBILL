import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  children,
  ...rest
}: Props) {
  return (
    <div {...rest} className={cn('hero-card', className)}>
      <div className="relative z-10">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
            {eyebrow}
          </p>
        )}
        <div className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">
          {title}
        </div>
        {subtitle && <div className="mt-1.5 text-[13px] text-white/80">{subtitle}</div>}
        {action && <div className="mt-4">{action}</div>}
        {children}
      </div>
    </div>
  );
}
