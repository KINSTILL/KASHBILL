import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size];
  return <div className={cn(px, 'animate-spin rounded-full border-2 border-slate-300 border-t-sage-500', className)} />;
}

