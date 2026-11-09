import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...rest }: Props) {
  return (
    <div {...rest} className={cn('surface p-5', className)}>
      {children}
    </div>
  );
}
