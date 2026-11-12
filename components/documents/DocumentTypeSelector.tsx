'use client';
import { useLocale } from 'next-intl';
import { DOC_TYPE_CONFIG, DOC_TYPE_ORDER } from '@/lib/documents/doc-type-config';
import { DocTypeIcon } from './DocTypeIcon';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import type { DocType } from '@prisma/client';

interface Props {
  value: DocType;
  onChange: (type: DocType) => void;
}

export function DocumentTypeSelector({ value, onChange }: Props) {
  const locale = useLocale();
  const isEn = locale === 'en';

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {DOC_TYPE_ORDER.map((type) => {
        const config = DOC_TYPE_CONFIG[type];
        const isActive = value === type;
        const shortLabel = isEn ? config.shortLabelEn : config.shortLabel;
        const description = isEn ? config.descriptionEn : config.description;

        return (
          <button
            key={type}
            type="button"
            onClick={() => {
              haptic('light');
              onChange(type);
            }}
            aria-pressed={isActive}
            className={cn(
              'transition-smooth group flex min-h-11 items-center gap-3 rounded-card border p-3 text-left',
              isActive
                ? 'border-sage-500 bg-sage-50 shadow-card ring-1 ring-sage-500/40'
                : 'border-slate-200 bg-white hover:border-sage-300 hover:shadow-card-hover'
            )}
          >
            <span
              className={cn(
                'transition-smooth flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border',
                isActive
                  ? 'border-sage-200 bg-white text-sage-600'
                  : 'border-slate-100 bg-slate-50 text-slate-500 group-hover:border-sage-200 group-hover:bg-white group-hover:text-sage-600'
              )}
            >
              <DocTypeIcon type={type} className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm font-semibold leading-tight',
                  isActive ? 'text-sage-900' : 'text-ink'
                )}
              >
                {shortLabel}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                {description}
              </span>
            </span>

            <span
              className={cn(
                'transition-smooth ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                isActive
                  ? 'border-sage-500 bg-sage-500 text-white'
                  : 'border-slate-200 text-transparent'
              )}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4 4 10-10" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
