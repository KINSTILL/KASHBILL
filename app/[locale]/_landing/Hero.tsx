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
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const { tier, country, fromWhatsApp } = personalization;
  const isFr = locale === 'fr';

  const badgeText =
    tier === 'tier1'
      ? isFr
        ? `${country.flag} Facturation officielle ${country.name} · Conforme OHADA`
        : `${country.flag} Official Invoicing in ${country.name} · OHADA Compliant`
      : isFr
        ? '🌍 Facturation pro WhatsApp & Mobile Money · Conforme OHADA'
        : '🌍 Pro WhatsApp & Mobile Money Invoicing · OHADA Compliant';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white px-4 pt-10 pb-16 sm:pt-16 sm:pb-24">
      {/* Lueur de fond ultra-douce */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[480px] max-w-4xl rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-300/10 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        {fromWhatsApp && (
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isFr
                ? 'Vous vendez sur WhatsApp ? Envoyez vos factures en 60s chrono.'
                : 'Selling on WhatsApp? Send invoices in 60 seconds.'}
            </span>
          </div>
        )}

        {/* Badge pays / statut */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-xs">
          <span>{badgeText}</span>
        </div>

        {/* Titre percutant & aéré */}
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl sm:leading-[1.12]">
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
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
          {isFr
            ? 'Devis, factures et reçus professionnels générés directement depuis votre smartphone. Vos clients règlent sans hésiter sur vos coordonnées Mobile Money ou bancaires.'
            : 'Professional quotes, invoices and receipts generated from your phone. Your clients pay with confidence to your Mobile Money or bank details.'}
        </p>

        {/* CTAs principaux optimisés mobile */}
        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href={`/${locale}/register` as Route} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[50px] px-7 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98"
            >
              <span>{isFr ? 'Créer ma première facture' : 'Create my first invoice'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          
          <a href="#demo" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto min-h-[50px] border-slate-200 bg-white font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>{isFr ? 'Voir la démo en direct' : 'Watch live demo'}</span>
            </Button>
          </a>
        </div>

        {/* Micro-preuves de confiance */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {isFr ? 'Plan gratuit (10 docs/mois)' : 'Free plan (10 docs/mo)'}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {isFr ? 'Sans carte bancaire' : 'No credit card needed'}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            {isFr ? '100% Conforme DGI & OHADA' : '100% Tax Compliant'}
          </span>
        </div>

        {/* Aperçu mobile épuré et moderne — Pas de surcharge, 100% responsive sans scroll horizontal */}
        <div className="relative mx-auto mt-10 max-w-sm px-1 sm:max-w-md">
          {/* Carte Document Mockup Moderne */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 text-left shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
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
              <p className="flex-1 truncate font-medium text-[11px] sm:text-xs">
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
