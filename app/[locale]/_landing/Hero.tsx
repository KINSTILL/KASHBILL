'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export function Hero({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';

  const documentTypes = [
    { label: isFr ? '📄 Devis' : '📄 Quotes', desc: isFr ? 'Offres & estimations' : 'Estimates' },
    { label: isFr ? '🧾 Factures' : '🧾 Invoices', desc: isFr ? 'Ventes officielles' : 'Sales' },
    { label: isFr ? '📑 Proformas' : '📑 Proformas', desc: isFr ? 'Accords & douane' : 'Agreements' },
    { label: isFr ? '💳 Reçus' : '💳 Receipts', desc: isFr ? 'Acomptes & soldes' : 'Payments' },
    { label: isFr ? '📦 Bons de commande' : '📦 Purchase Orders', desc: isFr ? 'Engagements' : 'Orders' },
    { label: isFr ? '🚚 Bons de livraison' : '🚚 Delivery slips', desc: isFr ? 'Suivi colis' : 'Dispatch' },
    { label: isFr ? '🏷️ Tickets 80mm' : '🏷️ 80mm Tickets', desc: isFr ? 'Caisse boutique' : 'POS' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white px-3 sm:px-4 pt-4 pb-8 sm:pt-14 sm:pb-20">
      {/* Lueur de fond ultra-douce */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[380px] max-w-4xl rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-300/10 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge de valeur épuré (Proposition 2A) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-slate-800 shadow-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            {isFr
              ? '⚡ Devis & Factures en 60s sur smartphone'
              : '⚡ Quotes & Invoices in 60s on smartphone'}
          </span>
        </div>

        {/* Titre SEO en forme de question percutante */}
        <h1 className="mt-2.5 sm:mt-4 text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.18] sm:leading-[1.12]">
          {isFr ? (
            <>
              Besoin d&apos;envoyer un devis ou une facture pro{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                à un client ?
              </span>
            </>
          ) : (
            <>
              Need to send a quote or professional invoice{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                to a client?
              </span>
            </>
          )}
        </h1>

        {/* Sous-titre avec mots-clés longue traîne ciblés (e-commerçants & prestataires, smartphone, PDF WhatsApp) */}
        <p className="mx-auto mt-2.5 sm:mt-4 max-w-2xl text-xs sm:text-base md:text-lg text-slate-600 leading-relaxed">
          {isFr
            ? "L'application de facturation pour e-commerçants et prestataires de services. Créez vos devis, factures et reçus en 60 secondes sur smartphone et partagez le PDF sur WhatsApp."
            : 'The invoicing app for online sellers and service professionals. Create quotes, invoices and receipts in 60 seconds on mobile and share the PDF on WhatsApp.'}
        </p>

        {/* Pastilles des 7 types de documents générables en quelques clics */}
        <div className="mt-3 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {documentTypes.map((doc, idx) => (
            <a
              key={idx}
              href="#demo"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all active:scale-95"
            >
              <span>{doc.label}</span>
            </a>
          ))}
        </div>

        {/* CTAs principaux : bouton Essayer masqué sur téléphone (déjà présent en permanence dans le header sticky) */}
        <div className="mt-3 sm:mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Link href={`/${locale}/register` as Route} className="hidden sm:inline-block w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[50px] px-6 sm:px-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-sm sm:text-base"
            >
              <span>{isFr ? 'Essayer gratuitement' : 'Try for free'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          
          <a href="#demo" className="w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="min-h-[38px] sm:min-h-[50px] px-4 sm:px-6 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 text-xs sm:text-sm shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
              <span>{isFr ? 'Voir la démo en direct' : 'Watch live demo'}</span>
            </Button>
          </a>
        </div>

        {/* Micro-preuves de confiance */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 font-semibold text-slate-800 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{isFr ? '10 docs offerts/mois' : '10 free docs/mo'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 font-semibold text-slate-800 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{isFr ? 'Sans carte bancaire' : 'No credit card'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 font-semibold text-slate-800 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{isFr ? '100% Conforme OHADA' : '100% OHADA Compliant'}</span>
          </span>
        </div>

        {/* Lien direct de connexion visible sur mobile pour les clients existants */}
        <p className="mt-2.5 text-center text-xs text-slate-500">
          {isFr ? 'Déjà inscrit ? ' : 'Already registered? '}
          <Link
            href={`/${locale}/login` as Route}
            className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
          >
            {isFr ? 'Se connecter à mon compte' : 'Log in to my account'}
          </Link>
        </p>

        {/* Aperçu Mobile Réaliste : Kmer Chic Boutique (< 640px) */}
        <div className="sm:hidden mx-auto mt-4 max-w-sm">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-lg ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    Kmer Chic Boutique
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Facture FA-2026-0042 · Estelle Ndongo</p>
              </div>
              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 border border-emerald-200/60">
                77 500 FCFA
              </span>
            </div>

            {/* Mini ligne avec intitulé Qté et Prix HT sur mobile */}
            <div className="mt-2 text-[11px] bg-slate-50 rounded-lg p-2 flex items-center justify-between">
              <span className="text-slate-700 font-medium truncate flex-1 pr-2">
                Robe Soie &amp; Wax + Sac cuir
              </span>
              <span className="text-slate-400 font-mono shrink-0">
                Qté: <strong className="text-slate-700">2</strong> · HT: <strong className="text-slate-900">75 000</strong>
              </span>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 pt-1">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate">
                <span>💬</span> {isFr ? 'Prêt à envoyer sur WhatsApp' : 'Ready for WhatsApp'}
              </span>
              <span className="text-slate-400 font-medium shrink-0">Orange &amp; MTN MoMo</span>
            </div>
          </div>
        </div>

        {/* Aperçu Desktop Réaliste : Option A Kmer Chic Boutique (>= 640px) */}
        <div className="hidden sm:block relative mx-auto mt-8 max-w-lg">
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            {/* En-tête de l'entreprise & Statut */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-slate-900">
                    Kmer Chic Boutique
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Douala, Akwa · Prêt-à-porter &amp; Accessoires
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                {isFr ? '✓ Prête à envoyer' : '✓ Ready to send'}
              </span>
            </div>

            {/* Client & Détails document */}
            <div className="mt-3.5 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                  {isFr ? 'Facturé à :' : 'Billed to:'}
                </p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">Mme Estelle Ndongo</p>
                <p className="text-[11px] text-slate-400">Bonanjo, Douala</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-100 font-mono text-[11px] font-bold text-slate-800 px-2 py-0.5 rounded">
                  FA-2026-0042
                </span>
                <p className="font-medium text-slate-600 text-xs mt-1">10 Nov 2026</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{isFr ? '● Paiement à réception' : '● Due on receipt'}</p>
              </div>
            </div>

            {/* Table d'articles avec en-têtes comptables clairs : Qté, Prix HT */}
            <div className="mt-3.5 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-slate-50 py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <span className="col-span-6">{isFr ? 'Désignation / Article' : 'Item / Description'}</span>
                <span className="col-span-2 text-center">{isFr ? 'Qté' : 'Qty'}</span>
                <span className="col-span-4 text-right">{isFr ? 'Prix HT' : 'Price HT'}</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                <div className="grid grid-cols-12 items-center py-2.5 px-3">
                  <span className="col-span-6 font-semibold text-slate-900 truncate">
                    Robe soirée Soie &amp; Wax brodé (M)
                  </span>
                  <span className="col-span-2 text-center font-mono text-slate-600">1</span>
                  <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    45 000 FCFA
                  </span>
                </div>
                <div className="grid grid-cols-12 items-center py-2.5 px-3">
                  <span className="col-span-6 font-semibold text-slate-900 truncate">
                    Sac à main cuir artisanal finition or
                  </span>
                  <span className="col-span-2 text-center font-mono text-slate-600">1</span>
                  <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    30 000 FCFA
                  </span>
                </div>
                <div className="grid grid-cols-12 items-center py-2.5 px-3">
                  <span className="col-span-6 font-semibold text-slate-900 truncate">
                    Livraison express coursier (Douala)
                  </span>
                  <span className="col-span-2 text-center font-mono text-slate-600">1</span>
                  <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    2 500 FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Total pro */}
            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-white shadow-sm">
              <div>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-emerald-100 block">
                  {isFr ? 'Total net à payer' : 'Total due'}
                </span>
                <span className="text-[11px] text-emerald-200">Règlement : Orange Money &amp; MTN MoMo</span>
              </div>
              <span className="font-mono text-2xl font-extrabold tracking-tight">77 500 FCFA</span>
            </div>

            {/* Bulle d'envoi WhatsApp intégrée */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50/80 p-2.5 text-xs text-emerald-950 border border-emerald-100">
              <span className="text-base shrink-0">💬</span>
              <p className="flex-1 truncate font-medium text-[11px]">
                « Bonjour Mme Ndongo, voici votre facture officielle N° FA-2026-0042. Merci pour votre commande chez Kmer Chic ! »
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
