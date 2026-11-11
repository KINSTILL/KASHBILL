'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentBadges } from '@/components/ui/PaymentBadges';
import type { LandingPersonalization } from '@/lib/landing/types';
import { ProPlanPicker } from '@/components/pricing/ProPlanPicker';
import { PRO_PLANS, planSavings } from '@/lib/pricing/plans';

export function Pricing({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const freeCurrency = 'FCFA';
  // Prix affiché : mensuel le plus bas (formule 1 an), en FCFA, comme ce qui est débité.
  const yearly = PRO_PLANS[PRO_PLANS.length - 1]!;
  const fromPrice = `${planSavings(yearly).perMonthXaf.toLocaleString('fr-FR')} FCFA`;

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
          <div className="surface p-4 sm:p-6">
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

          <div className="surface border-2 border-emerald-500 p-4 sm:p-6 shadow-lg">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              ⭐ {isFr ? 'Populaire — Statut Pro' : 'Popular — Pro Status'}
            </p>
            <h3 className="text-lg font-bold text-ink">Pro</h3>
            <p className="mt-1">
              <span className="text-sm text-slate-500">{isFr ? 'Dès' : 'From'}</span>{' '}
              <span className="text-3xl font-extrabold text-ink">{fromPrice}</span>{' '}
              <span className="text-sm text-slate-500">{isFr ? '/ mois' : '/ month'}</span>
            </p>
            <p className="text-xs font-semibold text-sage-700 mt-1">
              {isFr
                ? 'Formule 1 an · Sans engagement · Autres durées ci-dessous'
                : '1-year plan · No commitment · Other periods below'}
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
              <Button fullWidth>{isFr ? 'Passer Pro' : 'Go Pro'}</Button>
            </Link>
          </div>
        </div>

        {/* Formules Pro : même présentation que la page « Passer Pro » (affichage seul) */}
        <div id="pro-formules" className="mt-12">
          <h3 className="text-center text-xl font-bold text-ink">
            {isFr ? 'Choisissez la durée qui vous convient' : 'Choose the period that suits you'}
          </h3>
          <p className="mt-1 text-center text-sm text-slate-600">
            {isFr
              ? 'Plus la durée est longue, moins Pro coûte par mois. Paiement en FCFA.'
              : 'The longer the period, the less Pro costs per month. Paid in FCFA.'}
          </p>
          <div className="mt-6">
            <ProPlanPicker locale={locale} />
          </div>
          <div className="mt-6 flex justify-center">
            <Link href={`/${locale}/register` as Route}>
              <Button size="lg" className="min-w-[240px]">
                {isFr ? 'Créer mon compte et passer Pro' : 'Create my account and go Pro'}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2.5">
          <p className="text-xs font-medium text-slate-600">
            {isFr
              ? 'Options de paiement prises en charge par Notch Pay selon votre pays'
              : 'Payment options supported by Notch Pay depending on your country'}
          </p>
          <PaymentBadges />
        </div>

        <LandingAddOnsSection isFr={isFr} />
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">💳</span>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-bold text-ink text-sm">
                {isFr ? 'Règlement sécurisé de votre abonnement Pro via Notch Pay' : 'Secure payment of your Pro subscription via Notch Pay'}
              </p>
              <p>
                {isFr
                  ? "Les paiements d'abonnement s'effectuent exclusivement via la passerelle agréée Notch Pay : par Mobile Money (Orange Money, MTN MoMo, Wave, Moov...) selon votre pays, ou par carte bancaire (Visa, Mastercard) pour les autres pays. Aucun paiement ne se fait directement vers un compte ou portefeuille mobile personnel."
                  : "Subscription payments are processed exclusively via the certified Notch Pay gateway: via Mobile Money (Orange Money, MTN MoMo, Wave, Moov...) according to your country, or by credit card (Visa, Mastercard) for other countries. No payment is made directly to any personal mobile wallet account."}
              </p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                🔒 {isFr
                  ? "Transactions chiffrées Notch Pay · Zéro prélèvement automatique forcé · Vous renouvelez uniquement selon votre choix."
                  : "Encrypted Notch Pay transactions · No forced automatic renewal · You renew only when you decide."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingAddOnsSection({ isFr }: { isFr: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const addons = [
    {
      title: isFr ? 'Appareil supplémentaire' : 'Extra device',
      price: isFr ? '+500 FCFA/mois' : '+500 FCFA/month',
      shortDesc: isFr
        ? '+1 appareil simultané sur votre compte'
        : '+1 simultaneous device on your account',
      tooltip: isFr
        ? 'Votre abonnement Pro inclut déjà 2 appareils (ex : 1 téléphone + 1 ordinateur). Cette extension ajoute 1 appareil supplémentaire pour travailler à plusieurs ou sur un 3e écran sans déconnexion.'
        : 'Your Pro plan already includes 2 devices (e.g. 1 phone + 1 computer). This add-on unlocks 1 additional simultaneous device so you or a team member can work on a 3rd screen.',
    },
    {
      title: isFr ? 'Mon propre numéro WhatsApp' : 'My own WhatsApp number',
      price: isFr ? '+1 000 FCFA/mois' : '+1,000 FCFA/month',
      shortDesc: isFr
        ? 'Envoi direct du PDF brut depuis votre propre numéro WhatsApp'
        : 'Send raw PDFs directly from your own WhatsApp number',
      tooltip: isFr
        ? 'Connectez votre propre WhatsApp en 1 clic : vos clients reçoivent directement le fichier PDF brut depuis votre numéro WhatsApp habituel, dans votre fil de discussion existant, sans aucune mention de MyCashBill.'
        : 'Link your own WhatsApp in 1 click: your clients receive the raw PDF invoice directly from your personal/business WhatsApp number in your existing chat thread, with zero MyCashBill mention.',
    },
    {
      title: 'White-label',
      price: isFr ? '+3 000 FCFA/mois' : '+3,000 FCFA/month',
      shortDesc: isFr
        ? 'Retire toute mention MyCashBill de vos PDF'
        : 'Removes all MyCashBill mentions from your PDFs',
      tooltip: isFr
        ? 'Supprime la mention discrète « Généré sur MyCashBill » en bas de vos PDF et débloque la personnalisation des couleurs de votre marque sur vos factures A4.'
        : "Removes the discreet 'Generated with MyCashBill' footer from your PDFs and unlocks custom brand colors on your A4 invoices.",
    },
  ];

  return (
    <div className="mt-8 surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-ink">
            {isFr ? 'Extensions (Pro uniquement)' : 'Add-ons (Pro only)'}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {isFr
              ? 'Options facultatives activables à la carte depuis votre espace Pro'
              : 'Optional add-ons you can enable à la carte from your Pro workspace'}
          </p>
        </div>
        <span className="text-[11px] text-slate-500">
          {isFr
            ? '💡 Survolez sur PC ou touchez « ℹ️ Détails » sur mobile'
            : '💡 Hover on PC or tap "ℹ️ Details" on mobile'}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {addons.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-emerald-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      <Info className="h-3 w-3 text-emerald-600" />
                      <span>{isFr ? 'Détails' : 'Details'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.shortDesc}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/70">
                  {item.price}
                </span>
              </div>

              {/* Survol sur PC */}
              <div className="hidden sm:group-hover:block mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-2.5 text-xs text-slate-700 leading-relaxed">
                💡 {item.tooltip}
              </div>

              {/* Clic sur Mobile (ou clic explicite) */}
              {isOpen && (
                <div className="sm:group-hover:hidden mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-2.5 text-xs text-slate-700 leading-relaxed">
                  💡 {item.tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
