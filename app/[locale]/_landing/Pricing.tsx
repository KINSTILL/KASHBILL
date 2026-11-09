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
  const { tier, pricing, operators } = personalization;

  const proPrice = (tier === 'tier1' && pricing.proPriceLocalLabel) ? pricing.proPriceLocalLabel : '2 000 FCFA';
  const freeCurrency = 'FCFA';

  const paymentLine =
    tier === 'tier1'
      ? isFr
        ? `💳 Règlement sécurisé de votre abonnement Pro par Mobile Money (${operators.join(' · ')}) via Notch Pay`
        : `💳 Secure payment of your Pro subscription via Mobile Money (${operators.join(' · ')}) via Notch Pay`
      : isFr
        ? '💳 Règlement sécurisé de votre abonnement Pro par Carte bancaire (Visa · Mastercard) via Notch Pay'
        : '💳 Secure payment of your Pro subscription via Credit Card (Visa · Mastercard) via Notch Pay';

  return (
    <section id="pricing" className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold text-ink md:text-3xl">
          {isFr ? 'Un prix simple, pas de surprise.' : 'One price, no surprises.'}
        </h2>
        <p className="mt-2 text-center text-slate-600">
          {isFr
            ? 'Démarrez gratuitement sans carte bancaire. Passez Pro quand votre activité grandit.'
            : 'Start free with no credit card required. Upgrade to Pro as your business grows.'}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="surface p-6">
            <h3 className="text-lg font-bold text-ink">{isFr ? 'Gratuit' : 'Free'}</h3>
            <p className="mt-1">
              <span className="text-3xl font-extrabold text-ink">0</span>{' '}
              <span className="text-sm text-slate-500">{freeCurrency}</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ {isFr ? '10 documents / mois' : '10 documents / month'}</li>
              <li>✓ {isFr ? '5 envois WhatsApp & 1 email / mois' : '5 WhatsApp sends & 1 email / month'}</li>
              <li>✓ {isFr ? '2 clients enregistrés' : '2 saved clients'}</li>
              <li>✓ {isFr ? '1 seul appareil' : '1 device only'}</li>
              <li className="text-amber-800 font-medium">⚠️ {isFr ? 'Filigrane « Créé avec MyCashBill »' : 'Watermark « Created with MyCashBill »'}</li>
            </ul>
            <Link href={`/${locale}/register` as Route} className="mt-6 block">
              <Button fullWidth variant="secondary">
                {isFr ? 'Commencer gratuitement' : 'Start free'}
              </Button>
            </Link>
          </div>

          <div className="surface border-2 border-sage-500 p-6 shadow-lg">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage-700">
              ⭐ {isFr ? 'Populaire — Statut Pro' : 'Popular — Pro Status'}
            </p>
            <h3 className="text-lg font-bold text-ink">Pro</h3>
            <p className="mt-1">
              <span className="text-3xl font-extrabold text-ink">{proPrice}</span>{' '}
              <span className="text-sm text-slate-500">{isFr ? '/ 30 jours' : '/ 30 days'}</span>
            </p>
            <p className="text-xs font-semibold text-sage-700 mt-1">
              {isFr ? 'Soit environ 66 FCFA / jour · Sans engagement' : 'About 66 FCFA / day · No commitment'}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ {isFr ? 'Documents illimités' : 'Unlimited documents'}</li>
              <li>✓ {isFr ? 'Envois WhatsApp & emails illimités' : 'Unlimited WhatsApp & emails'}</li>
              <li>✓ {isFr ? 'Clients illimités' : 'Unlimited clients'}</li>
              <li className="text-emerald-700 font-medium">✓ {isFr ? 'Suppression du filigrane' : 'No watermark'}</li>
              <li>✓ {isFr ? 'Votre propre logo + signature' : 'Your custom logo + signature'}</li>
              <li>✓ {isFr ? '2 appareils inclus (Mobile + PC)' : '2 devices included (Mobile + PC)'}</li>
              <li>✓ {isFr ? 'Zéro prélèvement forcé (contrôle total)' : 'No forced renewal (full control)'}</li>
            </ul>
            <Link href={`/${locale}/register` as Route} className="mt-6 block">
              <Button fullWidth>{isFr ? 'Débloquer Pro (2 000 FCFA)' : 'Unlock Pro (2,000 FCFA)'}</Button>
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
      </div>
    </section>
  );
}
