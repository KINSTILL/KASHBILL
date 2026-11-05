import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function ProBadge({
  label,
  size = 'md',
}: {
  label?: string;
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('pro');
  return (
    <span
      className={cn(
        'pro-badge inline-flex items-center rounded-full uppercase',
        size === 'sm' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[10px]'
      )}
    >
      {label ?? t('badge')}
    </span>
  );
}
