'use client';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

interface Props {
  missingFields: string[];
  docLabel: string;
}

const FIELD_LABELS: Record<string, { fr: string; en: string }> = {
  taxId: { fr: 'NIU (Identifiant fiscal)', en: 'Tax ID (NIU)' },
  rccm: { fr: 'RCCM', en: 'Trade Register (RCCM)' },
  legalName: { fr: 'Raison sociale', en: 'Legal company name' },
  legalAddress: { fr: 'Adresse légale', en: 'Legal address' },
};

export function RequiredFieldsAlert({ missingFields, docLabel }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('documents.new');
  const isEn = locale === 'en';

  const formattedFields = missingFields
    .map((f) => FIELD_LABELS[f]?.[isEn ? 'en' : 'fr'] ?? f)
    .join(', ');

  return (
    <Alert variant="warning">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {t('requiredFieldsTitle')} ({docLabel})
        </p>
        <p className="text-xs text-slate-600">
          {t('requiredFieldsHelp', { fields: formattedFields })}
        </p>
        <Button size="sm" onClick={() => router.push(`/${locale}/settings/business` as Route)}>
          {t('completeProfileCta')}
        </Button>
      </div>
    </Alert>
  );
}
