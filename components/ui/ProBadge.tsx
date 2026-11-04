import { Badge } from './Badge';
import { useTranslations } from 'next-intl';

export function ProBadge({
  label,
  size,
}: {
  label?: string;
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('pro');
  return (
    <Badge variant="pro" size={size}>
      {label ?? t('badge')}
    </Badge>
  );
}
