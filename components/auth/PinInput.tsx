'use client';

import { useRef } from 'react';
import { Eye, EyeOff } from '@/components/ui/icons';

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  show: boolean;
  onToggleShow: () => void;
  showLabel: string;
  hideLabel: string;
  disabled?: boolean;
  length?: number;
  /** Callback lorsqu'on colle LENGTH chiffres d'un coup (OTP). */
  onCompletePaste?: (full: string) => void;
};

/**
 * Saisie PIN en cases individuelles (mobile-first) :
 * auto-avance, retour arriere, fleches, copier-coller OTP, afficher/masquer.
 */
export function PinInput({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  showLabel,
  hideLabel,
  disabled,
  length = 6,
  onCompletePaste,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        refs.current[index - 1]?.focus();
      } else {
        const next = [...value];
        next[index] = '';
        onChange(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    if (!pasted) return;
    const next = [...value];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i] ?? '';
    }
    onChange(next);
    const target = Math.min(pasted.length, length - 1);
    refs.current[target]?.focus();
    if (pasted.length === length) onCompletePaste?.(pasted);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleShow}
          className="flex items-center gap-1 text-xs font-medium text-sage-600 transition-colors hover:text-sage-700"
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>{hideLabel}</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>{showLabel}</span>
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
        {value.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type={show ? 'text' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            aria-label={`Chiffre ${idx + 1}`}
            className="aspect-square w-full rounded-xl border border-slate-300 bg-slate-50 text-center text-lg font-bold text-slate-900 transition-all focus:border-sage-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50"
          />
        ))}
      </div>
    </div>
  );
}
