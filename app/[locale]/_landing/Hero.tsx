'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export function Hero({
  personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const { tier, country, fromWhatsApp } = personalization;
  const isFr = locale === 'fr';

  const badgeText =
    fromWhatsApp
      ? isFr
        ? '💬 Conçu pour les vendeurs WhatsApp · Envoi en 60s'
        : '💬 Built for WhatsApp sellers · Send in 60s'
      : tier === 'tier1'
      ? isFr
        ? `${country.flag} Facturation officielle ${country.name} · Conforme OHADA`
        : `${country.flag} Official Invoicing in ${country.name} · OHADA Compliant`
      : isFr
        ? '🌍 Facturation pro WhatsApp & Mobile Money · Conforme OHADA'
        : '🌍 Pro WhatsApp & Mobile Money Invoicing · OHADA Compliant';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white px-3 sm:px-4 pt-4 pb-8 sm:pt-16 sm:pb-24">
      {/* Lueur de fond ultra-douce */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[380px] max-w-4xl rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-300/10 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge unique ultra-compact */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-0.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{badgeText}</span>
        </div>

        {/* Titre percutant & aéré sans surcharge */}
        <h1 className="mt-3 sm:mt-5 text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.12]">
          {isFr ? (
            <>
              Facturez en 60 secondes.{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Faites-vous payer par WhatsApp.
              </span>
            </>
          ) : (
            <>
              Invoice in 60 seconds.{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Get paid on WhatsApp.
              </span>
            </>
          )}
        </h1>

        {/* Sous-titre concis */}
        <p className="mx-auto mt-2.5 sm:mt-4 max-w-2xl text-xs sm:text-base md:text-lg text-slate-600 leading-relaxed">
          {isFr
            ? 'Devis, factures et reçus professionnels. Vos clients paient sans hésiter sur vos coordonnées Mobile Money ou bancaires.'
            : 'Professional quotes, invoices and receipts. Your clients pay with confidence to your Mobile Money or bank details.'}
        </p>

        {/* CTAs principaux optimisés mobile */}
        <div className="mt-4 sm:mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
          <Link href={`/${locale}/register` as Route} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[46px] sm:min-h-[50px] px-6 sm:px-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-sm sm:text-base"
            >
              <span>{isFr ? 'Essayer gratuitement' : 'Try for free'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          
          <a href="#demo" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto min-h-[42px] sm:min-h-[50px] border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 text-xs sm:text-sm"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>{isFr ? 'Voir la démo en direct' : 'Watch live demo'}</span>
            </Button>
          </a>
        </div>

        {/* Micro-preuves de confiance */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {isFr ? '10 docs offerts/mois' : '10 free docs/mo'}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {isFr ? 'Sans carte bancaire' : 'No credit card'}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            {isFr ? 'Conforme OHADA' : 'OHADA Compliant'}
          </span>
        </div>

        {/* Aperçu sur Mobile : Version Compacte & Légère (< 640px) */}
        <div className="sm:hidden mx-auto mt-4 max-w-sm">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-md ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {isFr ? 'Facture N° 0042' : 'Invoice #0042'} · Estelle Ndongo
                </span>
              </div>
              <span className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                87 500 FCFA
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span>💬</span> {isFr ? 'Facture prête pour WhatsApp' : 'Invoice ready for WhatsApp'}
              </span>
              <span className="text-slate-400 font-medium">PDF · OHADA</span>
            </div>
          </div>
        </div>

        {/* Aperçu Desktop : Maquette complète et détaillée (>= 640px) */}
        <div className="hidden sm:block relative mx-auto mt-8 max-w-md">
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            {/* Barre supérieure statut */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">
                  {isFr ? 'Facture N° FA-2026-0042' : 'Invoice # FA-2026-0042'}
                </span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                {isFr ? '✓ Prête à envoyer' : '✓ Ready to send'}
              </span>
            </div>

            {/* Client & Détails */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-medium">{isFr ? 'Facturé à :' : 'Billed to:'}</p>
                <p className="font-bold text-slate-900">Mme Estelle Ndongo</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">{isFr ? 'Émission :' : 'Issued:'}</p>
                <p className="font-medium text-slate-700">10 Nov 2026</p>
              </div>
            </div>

            {/* Ligne d'articles simplifiée */}
            <div className="mt-3 divide-y divide-slate-100 rounded-xl bg-slate-50/80 p-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-800">
                  {isFr ? 'Confection ensemble 3 pièces sur mesure' : 'Custom 3-piece tailored outfit'}
                </span>
                <span className="font-mono font-bold text-slate-900 ml-2 whitespace-nowrap">85 000 FCFA</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-800">
                  {isFr ? 'Livraison express coursier' : 'Express courier delivery'}
                </span>
                <span className="font-mono font-bold text-slate-900 ml-2 whitespace-nowrap">2 500 FCFA</span>
              </div>
            </div>

            {/* Total pro */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-white shadow-sm">
              <span className="text-xs font-semibold tracking-wide uppercase text-emerald-100">
                {isFr ? 'Total net à payer' : 'Total due'}
              </span>
              <span className="font-mono text-xl font-extrabold tracking-tight">87 500 FCFA</span>
            </div>

            {/* Bulle d'envoi WhatsApp intégrée */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2 text-xs text-emerald-900 border border-emerald-100">
              <span className="text-base">💬</span>
              <p className="flex-1 truncate font-medium text-xs">
                {isFr
                  ? '« Bonjour Estelle, voici votre facture officielle N° 0042. »'
                  : '« Hello Estelle, here is your official invoice #0042. »'}
              </p>
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                WhatsApp
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
