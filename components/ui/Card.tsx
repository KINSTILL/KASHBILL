import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...rest }: Props) {
  return (
    <div {...rest} className={cn('surface rounded-xl border border-slate-100 bg-white p-5', className)}>
      {children}
    </div>
  );
}
