import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>{children}</div>;
}

