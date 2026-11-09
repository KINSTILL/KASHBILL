import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function Pricing({
  personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const { tier, pricing, operators, country } = personalization;

  const proPrice = tier === 'tier1' ? pricing.proPriceLocalLabel : pricing.proPriceFallbackLabel;
  const freeCurrency = country?.currencySymbol || 'FCFA';

  const paymentLine =
    tier === 'tier1'
      ? isFr
        ? `💳 ${operators.join(' · ')} · Carte bancaire`
        : `💳 ${operators.join(' · ')} · Credit card`
      : isFr
        ? '💳 Carte bancaire (Visa, Mastercard) · Mobile Money bientôt disponible'
        : '💳 Credit card (Visa, Mastercard) · Mobile Money coming soon';

  return (
    <section id="pricing" className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold text-ink md:text-3xl">
          {isFr ? 'Un prix simple, pas de surprise.' : 'One price, no surprises.'}
        </h2>
        <p className="mt-2 text-center text-slate-600">
          {isFr
            ? "30 jours Pro offerts à l'inscription. Aucune carte requise."
            : '30-day Pro trial at signup. No card required.'}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="surface p-6">
            <h3 className="text-lg font-bold text-ink">{isFr ? 'Gratuit' : 'Free'}</h3>
            <p className="mt-1">
              <span className="text-3xl font-extrabold text-ink">0</span>{' '}
              <span className="text-sm text-slate-500">{freeCurrency}</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ {isFr ? '10 documents/mois' : '10 documents/month'}</li>
              <li>✓ {isFr ? '5 envois WhatsApp/mois' : '5 WhatsApp sends/month'}</li>
              <li>✓ {isFr ? '2 clients' : '2 clients'}</li>
              <li>✓ {isFr ? 'Filigrane visible' : 'Visible watermark'}</li>
            </ul>
            <Link href={`/${locale}/register` as Route} className="mt-6 block">
              <Button fullWidth variant="secondary">
                {isFr ? 'Commencer' : 'Start'}
              </Button>
            </Link>
          </div>

          <div className="surface border-2 border-sage-500 p-6 shadow-lg">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage-700">
              ⭐ {isFr ? 'Populaire' : 'Popular'}
            </p>
            <h3 className="text-lg font-bold text-ink">Pro</h3>
            <p className="mt-1">
              <span className="text-3xl font-extrabold text-ink">{proPrice}</span>{' '}
              <span className="text-sm text-slate-500">{isFr ? '/ 30 jours' : '/ 30 days'}</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ {isFr ? 'Documents illimités' : 'Unlimited documents'}</li>
              <li>✓ {isFr ? 'Envois illimités' : 'Unlimited sends'}</li>
              <li>✓ {isFr ? 'Clients illimités' : 'Unlimited clients'}</li>
              <li>✓ {isFr ? 'Sans filigrane' : 'No watermark'}</li>
              <li>✓ {isFr ? 'Logo + signature' : 'Logo + signature'}</li>
              <li>✓ {isFr ? '2 appareils' : '2 devices'}</li>
            </ul>
            <Link href={`/${locale}/register` as Route} className="mt-6 block">
              <Button fullWidth>{isFr ? 'Passer Pro' : 'Go Pro'}</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 surface p-6">
          <h3 className="text-base font-bold text-ink">{isFr ? 'Extensions (Pro uniquement)' : 'Add-ons (Pro only)'}</h3>
          <p className="mt-1 text-xs text-slate-500">{isFr ? 'Ajoutez à votre abonnement Pro' : 'Add to your Pro subscription'}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-ink">{isFr ? 'Appareil supplémentaire' : 'Extra device'}</p>
                <p className="text-xs text-slate-500">+500 FCFA/{isFr ? 'mois' : 'month'}</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{isFr ? 'Sur /upgrade' : 'On /upgrade'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-ink">White-label</p>
                <p className="text-xs text-slate-500">+3 000 FCFA/{isFr ? 'mois' : 'month'}</p>
                <p className="text-[11px] text-slate-400">{isFr ? 'Retire le branding MyCashBill de vos PDF' : 'Removes MyCashBill branding from PDFs'}</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{isFr ? 'Sur /upgrade' : 'On /upgrade'}</span>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">{paymentLine}</p>
        {tier === 'tier2' && (
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {isFr
              ? 'Les liens de paiement Mobile Money seront disponibles prochainement dans votre zone. Votre abonnement Pro reste payable par carte bancaire.'
              : 'Mobile Money payment links will soon be available in your region. Your Pro subscription remains payable by credit card.'}
          </p>
        )}
      </div>
    </section>
  );
}
