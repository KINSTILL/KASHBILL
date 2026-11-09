import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function Hero({
  personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const { tier, country, device, fromWhatsApp } = personalization;
  const isFr = locale === 'fr';
  const deviceLabel =
    device === 'android' ? 'Android' : device === 'ios' ? 'iPhone' : isFr ? 'ordinateur' : 'computer';

  const badge =
    tier === 'tier1'
      ? isFr
        ? `${country.flag} Conçu pour ${country.name} · Devis & Factures professionnels`
        : `${country.flag} Built for ${country.name} · Professional Quotes & Invoices`
      : isFr
        ? '🌍 Panafricain · Facturation conforme OHADA & multidevise'
        : '🌍 Pan-African · OHADA-compliant invoicing & multi-currency';


  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sage-50 to-white px-4 pt-16 pb-20">
      <div className="mx-auto max-w-5xl">
        {fromWhatsApp && (
          <div className="mb-6 rounded-full bg-whatsapp/10 px-4 py-2 text-center text-sm text-whatsapp-dark">
            💬 {isFr ? 'Vous venez de WhatsApp ? Voici comment ça marche en 1 min.' : "From WhatsApp? Here's how it works in 1 min."}
          </div>
        )}

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {badge}
          </span>

          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
            {isFr ? 'Arrêtez de perdre 30 minutes par facture.' : 'Stop losing 30 minutes per invoice.'}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            {isFr
              ? `Générez une facture conforme en 47 secondes sur votre ${deviceLabel}, prête à envoyer par WhatsApp.`
              : `Generate a compliant invoice in 47 seconds on your ${deviceLabel}, ready to send via WhatsApp.`}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/register` as Route}>
              <Button size="lg" className="min-w-[220px]">
                {isFr ? 'Commencer gratuitement' : 'Start for free'}
              </Button>
            </Link>
            <a href="#demo">
              <Button size="lg" variant="secondary" className="min-w-[220px]">
                {isFr ? 'Essayer sans inscription' : 'Try without signing up'}
              </Button>
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {isFr
              ? '✓ Plan gratuit immédiat  ·  ✓ Sans carte bancaire  ·  ✓ Vos clients vous règlent en direct'
              : '✓ Immediate free plan  ·  ✓ No credit card required  ·  ✓ Your clients pay you directly'}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-[10px] text-slate-400">mycashbill.app/{locale}/documents/new</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/landing/hero-${device === 'desktop' ? 'desktop' : device}.webp`}
              alt={isFr ? "Aperçu de l'application MyCashBill" : 'MyCashBill app preview'}
              className="block w-full rounded-b-2xl"
              width={1200}
              height={700}
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
