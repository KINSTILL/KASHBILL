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
 * Emblème géométrique « Cash-Flow K » : pli de facture sécurisée & validation instantanée.
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

  const iconDimensions = isSm
    ? 'h-8 w-8 rounded-[10px]'
    : isLg
    ? 'h-12 w-12 rounded-[16px]'
    : 'h-10 w-10 rounded-[13px]';

  const iconSvg = (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-900/15 ring-1 ring-inset ring-white/25 transition-transform group-hover:scale-105 ${iconDimensions}`}
    >
      {/* Lueur subtile en fond d'icône */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/10 to-white/20 pointer-events-none" />

      {/* Symbole vectoriel géométrique exclusif : Facture origami + Éclair 'K' & Coche certifiée */}
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSm ? 'h-4 w-4' : isLg ? 'h-6 w-6' : 'h-5 w-5'}
      >
        {/* Colonne gauche (barre du K / tranche du document) */}
        <rect x="5" y="5" width="4" height="18" rx="2" fill="white" fillOpacity="0.95" />
        
        {/* Bras supérieur du K (flèche ascendante / pli du devis) */}
        <path
          d="M10 14.5L18.5 6.5C19.3 5.7 20.7 6.3 20.7 7.4V8.2C20.7 8.9 20.3 9.5 19.8 10L12.5 16.5"
          fill="white"
          fillOpacity="0.85"
        />
        
        {/* Bras inférieur / Coche dynamique de validation cashflow */}
        <path
          d="M10.8 13.2L18.8 20.8C19.4 21.4 20.4 21.4 21 20.8C21.6 20.2 21.6 19.2 21 18.6L14.2 12"
          fill="white"
          fillOpacity="1"
        />
        
        {/* Point d'accent sécurisé / certification micro-dot */}
        <circle cx="21" cy="7.5" r="1.5" fill="#34D399" />
      </svg>
    </span>
  );

  const content = (
    <span className={`group inline-flex items-center gap-2.5 ${className}`}>
      {iconSvg}
      {!iconOnly && (
        <span className="flex flex-col">
          <span
            className={`font-sans tracking-tight leading-none text-slate-900 flex items-center ${
              isSm ? 'text-[15px]' : isLg ? 'text-2xl' : 'text-lg sm:text-xl'
            }`}
          >
            <span className="font-semibold text-slate-600">My</span>
            <span className="font-extrabold text-slate-950 ml-0.5">Cash</span>
            <span className="font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Bill
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 shrink-0" />
          </span>
          {subtitle ? (
            <span
              className={`mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
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
