import Link from 'next/link';
import type { Route } from 'next';
import { ShieldCheck } from '@/components/ui/icons';

type Props = {
  href?: string;
  size?: 'sm' | 'md';
  subtitle?: string;
  className?: string;
};

// Logo unique de MyCashBill : bouclier (emblème officiel) + wordmark « My » / « CashBill ».
// Référence visuelle : écran de connexion. Utilisé partout (app, landing, footer, admin, pages publiques).
export function Logo({ href, size = 'md', subtitle, className = '' }: Props) {
  const isSm = size === 'sm';
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-xl bg-sage-600 text-white shadow-sm shadow-sage-600/20 ${
          isSm ? 'h-8 w-8' : 'h-10 w-10'
        }`}
      >
        <ShieldCheck className={isSm ? 'h-4.5 w-4.5' : 'h-6 w-6'} strokeWidth={2.2} />
      </span>
      <span className="flex flex-col">
        <span
          className={`font-bold leading-none tracking-tight text-slate-900 ${isSm ? 'text-base' : 'text-xl'}`}
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
    <Link href={href as Route} aria-label="MyCashBill" className="group inline-flex items-center transition-transform active:scale-95">
      {content}
    </Link>
  );
}
