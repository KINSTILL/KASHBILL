'use client';
import { useLocale } from 'next-intl';
import { DOC_TYPE_CONFIG, DOC_TYPE_ORDER } from '@/lib/documents/doc-type-config';
import type { DocType } from '@prisma/client';

interface Props {
  value: DocType;
  onChange: (type: DocType) => void;
}

export function DocumentTypeSelector({ value, onChange }: Props) {
  const locale = useLocale();
  const isEn = locale === 'en';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {DOC_TYPE_ORDER.map((type) => {
        const config = DOC_TYPE_CONFIG[type];
        const isActive = value === type;
        const shortLabel = isEn ? config.shortLabelEn : config.shortLabel;
        const description = isEn ? config.descriptionEn : config.description;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
              isActive
                ? 'border-sage-500 bg-sage-50 ring-1 ring-sage-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="text-2xl leading-none">{config.icon}</span>
            <span className={`text-sm font-semibold ${isActive ? 'text-sage-900' : 'text-slate-900'}`}>
              {shortLabel}
            </span>
            <span className="text-[10px] leading-tight text-slate-500">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
