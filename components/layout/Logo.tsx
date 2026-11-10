import Link from 'next/link';
import type { Route } from 'next';

type Props = {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  hideSubtitleOnMobile?: boolean;
  className?: string;
  iconOnly?: boolean;
};

/**
 * Logo officiel MyCashBill — Identité Neo-Fintech 2026.
 * Emblème « L’Entrelacs Cashflow » (Option A) : boucle vectorielle infinie émetteur & encaissement.
 */
export function Logo({
  href,
  size = 'md',
  subtitle,
  hideSubtitleOnMobile = false,
  className = '',
  iconOnly = false,
}: Props) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSvg = (
    <span
      aria-hidden="true"
      className="relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={isSm ? 30 : isLg ? 40 : 34}
        height={isSm ? 30 : isLg ? 40 : 34}
        className={isSm ? 'h-7.5 w-7.5 shrink-0' : isLg ? 'h-10 w-10 shrink-0' : 'h-8.5 w-8.5 shrink-0'}
      >
        {/* Boucle 1 : Document / Émetteur (Noir carbone net et garanti visible) */}
        <path
          d="M6 22V10C6 7.79086 7.79086 6 10 6H16C18.2091 6 20 7.79086 20 10V11"
          stroke="#09090b"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        {/* Boucle 2 : Cashflow / Envoi & Règlement (Vert émeraude néon) */}
        <path
          d="M26 10V22C26 24.2091 24.2091 26 22 26H16C13.7909 26 12 24.2091 12 22V21"
          stroke="#10B981"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        {/* Puce centrale de transfert / validation certifiée */}
        <circle cx="16" cy="16" r="2.4" fill="#10B981" />
      </svg>
    </span>
  );

  const content = (
    <span className={`group inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      {iconSvg}
      {!iconOnly && (
        <span className="flex flex-col">
          <span
            className={`font-sans tracking-tight leading-none flex items-center ${
              isSm ? 'text-[17.5px] sm:text-[19px]' : isLg ? 'text-2xl' : 'text-xl'
            }`}
          >
            <span style={{ color: '#1e293b' }} className="font-bold">
              My
            </span>
            <span style={{ color: '#09090b' }} className="font-black ml-0.5">
              Cash
            </span>
            <span className="font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent ml-0.5">
              Bill
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 shrink-0" />
          </span>
          {subtitle ? (
            <span
              style={{ color: '#94a3b8' }}
              className={`mt-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                hideSubtitleOnMobile ? 'hidden sm:block' : ''
              }`}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href as Route}
      aria-label="MyCashBill"
      className="inline-flex items-center transition-transform active:scale-95 focus:outline-none"
    >
      {content}
    </Link>
  );
}
