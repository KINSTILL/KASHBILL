import Link from 'next/link';
import type { Route } from 'next';
import { ShieldCheck } from '@/components/ui/icons';

type Props = {
  href?: string;
  size?: 'sm' | 'md';
  subtitle?: string;
  className?: string;
};

// Logo unique de MyCashBill : bouclier (emblème officiel) sur dégradé sage + wordmark « My » / « CashBill ».
// Utilisé partout : app, landing, footer, auth, admin, pages publiques. Équivalents : app/icon.svg, lib/brand.ts.
export function Logo({ href, size = 'md', subtitle, className = '' }: Props) {
  const isSm = size === 'sm';
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`flex items-center justify-center bg-gradient-to-br from-sage-500 to-sage-700 text-white shadow-sm shadow-sage-700/25 ring-1 ring-inset ring-white/15 ${
          isSm ? 'h-8 w-8 rounded-[10px]' : 'h-10 w-10 rounded-xl'
        }`}
      >
        <ShieldCheck className={isSm ? 'h-[18px] w-[18px]' : 'h-6 w-6'} strokeWidth={2.2} />
      </span>
      <span className="flex flex-col">
        <span
          className={`font-display font-bold leading-none tracking-[-0.03em] text-ink ${isSm ? 'text-base' : 'text-xl'}`}
        >
          My<span className="text-sage-600">CashBill</span>
        </span>
        {subtitle && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href as Route} aria-label="MyCashBill" className="inline-flex items-center transition-transform active:scale-95">
      {content}
    </Link>
  );
}
