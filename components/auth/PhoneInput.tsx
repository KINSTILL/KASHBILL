'use client';

import { Smartphone } from '@/components/ui/icons';

/**
 * Champ du chef de numéro de téléphone camerounais avec préfixe 🇨🇲 +237 fixe
 * et masque de saisie fluide 6XX XX XX XX (9 chiffres).
 */
export function formatCameroonPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 9);
  const parts: string[] = [];
  if (cleaned.length > 0) parts.push(cleaned.slice(0, 3));
  if (cleaned.length > 3) parts.push(cleaned.slice(3, 5));
  if (cleaned.length > 5) parts.push(cleaned.slice(5, 7));
  if (cleaned.length > 7) parts.push(cleaned.slice(7, 9));
  return parts.join(' ');
}

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (formatted: string) => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
};

export function PhoneInput({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  id = 'phone',
  required,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
      >
        {label}
      </label>
      <div className="flex rounded-xl border border-slate-300 bg-white transition-all focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-600/20">
        <span className="inline-flex select-none items-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-700">
          <span className="text-base" role="img" aria-label="Cameroun">
            🇨🇲
          </span>
          <span>+237</span>
        </span>
        <div className="relative flex flex-1 items-center">
          <Smartphone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            id={id}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(formatCameroonPhone(e.target.value))}
            disabled={disabled}
            required={required}
            className="w-full rounded-r-xl bg-transparent py-3 pl-10 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
