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
        ? '💬 Partage instantané sur WhatsApp · Envoi PDF en 60s'
        : '💬 Instant WhatsApp share · 60s PDF delivery'
      : tier === 'tier1'
      ? isFr
        ? `${country.flag} Facturation officielle ${country.name} · Conforme OHADA`
        : `${country.flag} Official Invoicing in ${country.name} · OHADA Compliant`
      : isFr
        ? '🌍 Facturation pro WhatsApp & Mobile Money · Conforme OHADA'
        : '🌍 Pro WhatsApp & Mobile Money Invoicing · OHADA Compliant';

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
        {/* Badge d'autorité compact */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-0.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{badgeText}</span>
        </div>

        {/* Titre SEO en forme de question percutante */}
        <h1 className="mt-3 sm:mt-5 text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.18] sm:leading-[1.12]">
          {isFr ? (
            <>
              Besoin d&apos;un devis ou d&apos;une facture pro{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                en moins de 60 secondes ?
              </span>
            </>
          ) : (
            <>
              Need a professional quote or invoice{' '}
              <span className="block bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                in less than 60 seconds?
              </span>
            </>
          )}
        </h1>

        {/* Sous-titre clarifié (règlement sur Mobile Money / Banque, partage via WhatsApp) */}
        <p className="mx-auto mt-2.5 sm:mt-4 max-w-2xl text-xs sm:text-base md:text-lg text-slate-600 leading-relaxed">
          {isFr
            ? 'Générez vos documents commerciaux sur votre smartphone et partagez-les en un clic sur WhatsApp. Vos clients règlent directement sur vos coordonnées Mobile Money ou bancaires.'
            : 'Generate your commercial documents on your smartphone and share them in one click on WhatsApp. Your clients pay directly to your Mobile Money or bank details.'}
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

        {/* CTAs principaux optimisés mobile */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
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
        <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-slate-500">
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
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-md ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    Kmer Chic Boutique
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Facture N° FA-2026-0042 · Estelle Ndongo</p>
              </div>
              <span className="font-mono text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                77 500 FCFA
              </span>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate">
                <span>💬</span> {isFr ? 'Partagé sur WhatsApp' : 'Shared on WhatsApp'}
              </span>
              <span className="text-slate-400 font-medium shrink-0">Orange &amp; MTN MoMo</span>
            </div>
          </div>
        </div>

        {/* Aperçu Desktop Réaliste : Option A Kmer Chic Boutique (>= 640px) */}
        <div className="hidden sm:block relative mx-auto mt-8 max-w-md">
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            {/* En-tête de l'entreprise & Statut */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-900">
                    Kmer Chic Boutique
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Douala, Akwa · Prêt-à-porter &amp; Accessoires
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                {isFr ? '✓ Prête à envoyer' : '✓ Ready to send'}
              </span>
            </div>

            {/* Client & Détails document */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-medium">{isFr ? 'Facturé à :' : 'Billed to:'}</p>
                <p className="font-bold text-slate-900">Mme Estelle Ndongo</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">Facture N° FA-2026-0042</p>
                <p className="font-medium text-slate-700">10 Nov 2026</p>
              </div>
            </div>

            {/* Lignes d'articles réalistes (Option A) */}
            <div className="mt-3 divide-y divide-slate-100 rounded-xl bg-slate-50/80 p-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-800">
                  Robe de soirée Soie &amp; Wax brodé (Taille M)
                </span>
                <span className="font-mono font-bold text-slate-900 ml-2 whitespace-nowrap">45 000 FCFA</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-800">
                  Sac à main cuir artisanal finition or
                </span>
                <span className="font-mono font-bold text-slate-900 ml-2 whitespace-nowrap">30 000 FCFA</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-800">
                  Livraison express coursier (Douala)
                </span>
                <span className="font-mono font-bold text-slate-900 ml-2 whitespace-nowrap">2 500 FCFA</span>
              </div>
            </div>

            {/* Total pro */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-white shadow-sm">
              <div>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-emerald-100 block">
                  {isFr ? 'Total net à payer' : 'Total due'}
                </span>
                <span className="text-[11px] text-emerald-200">Règlement : Orange Money &amp; MTN MoMo</span>
              </div>
              <span className="font-mono text-xl font-extrabold tracking-tight">77 500 FCFA</span>
            </div>

            {/* Bulle d'envoi WhatsApp intégrée */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50/80 p-2 text-xs text-emerald-950 border border-emerald-100">
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
