'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { useLocale } from 'next-intl';
import { Smartphone, ChevronDown, Check, Search } from '@/components/ui/icons';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  type DialCountry,
} from '@/lib/countries/dial-codes';

export function formatPhoneNumber(
  value: string,
  maxDigits: number = 10,
  dialCode?: string
): string {
  let digitsOnly = value.replace(/\D/g, '');
  if (dialCode) {
    const dialDigits = dialCode.replace(/\D/g, '');
    if (
      dialDigits &&
      digitsOnly.startsWith(dialDigits) &&
      digitsOnly.length > maxDigits
    ) {
      digitsOnly = digitsOnly.slice(dialDigits.length);
    }
  }
  const cleaned = digitsOnly.slice(0, maxDigits);
  const parts: string[] = [];
  if (cleaned.length <= 9) {
    if (cleaned.length > 0) parts.push(cleaned.slice(0, 3));
    if (cleaned.length > 3) parts.push(cleaned.slice(3, 5));
    if (cleaned.length > 5) parts.push(cleaned.slice(5, 7));
    if (cleaned.length > 7) parts.push(cleaned.slice(7, 9));
  } else {
    for (let i = 0; i < cleaned.length; i += 2) {
      parts.push(cleaned.slice(i, i + 2));
    }
  }
  return parts.join(' ');
}

export function formatCameroonPhone(value: string): string {
  return formatPhoneNumber(value, 9);
}

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (formatted: string) => void;
  countryCode?: string;
  onCountryChange?: (country: DialCountry) => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
};

export function PhoneInput({
  label,
  placeholder = '',
  value,
  onChange,
  countryCode,
  onCountryChange,
  disabled,
  id,
  required,
}: Props) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const locale = useLocale();
  const isEn = locale === 'en';

  const [internalCountryCode, setInternalCountryCode] = useState(countryCode || DEFAULT_COUNTRY.code);
  const activeCode = countryCode || internalCountryCode;
  const currentCountry = getCountryByCode(activeCode);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Synchronisation si le code pays externe change
  useEffect(() => {
    if (countryCode && countryCode !== internalCountryCode) {
      setInternalCountryCode(countryCode);
    }
  }, [countryCode, internalCountryCode]);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus sur la recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleCountrySelect = (c: DialCountry) => {
    setInternalCountryCode(c.code);
    onCountryChange?.(c);
    setIsOpen(false);
  };

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = isEn ? c.nameEn.toLowerCase() : c.nameFr.toLowerCase();
    const otherName = isEn ? c.nameFr.toLowerCase() : c.nameEn.toLowerCase();
    return (
      name.includes(q) ||
      otherName.includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        htmlFor={inputId}
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
      >
        {label}
      </label>

      <div className="flex rounded-xl border border-slate-300 bg-white transition-all focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-600/20">
        {/* Bouton de sélection d'indicatif avec drapeau */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={isEn ? 'Select country' : 'Choisir le pays'}
          className="inline-flex select-none items-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            {currentCountry.flag}
          </span>
          <span className="font-mono text-xs font-bold text-slate-800">
            {currentCountry.dialCode}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-sage-600' : ''
            }`}
          />
        </button>

        {/* Champ de saisie du numéro */}
        <div className="relative flex flex-1 items-center">
          <Smartphone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            id={inputId}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={placeholder}
            value={value}
            onChange={(e) =>
              onChange(
                formatPhoneNumber(
                  e.target.value,
                  currentCountry.maxDigits,
                  currentCountry.dialCode
                )
              )
            }
            disabled={disabled}
            required={required}
            className="w-full rounded-r-xl bg-transparent py-3 pl-10 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 sm:text-sm"
          />
        </div>
      </div>

      {/* Menu déroulant avec scroll pour choisir le pays */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          {/* Barre de recherche */}
          <div className="relative mb-1.5 px-1 pt-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search country or code…' : 'Rechercher un pays ou indicatif…'}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sage-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sage-500"
            />
          </div>

          {/* Liste déroulante avec scroll fluide */}
          <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {isEn ? 'No country found' : 'Aucun pays trouvé'}
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === currentCountry.code;
                const countryName = isEn ? c.nameEn : c.nameFr;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleCountrySelect(c)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-sage-50 font-semibold text-sage-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none" aria-hidden="true">
                        {c.flag}
                      </span>
                      <span className="truncate">{countryName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {c.dialCode}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-sage-600" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
