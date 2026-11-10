'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, X, Eye, QrCode, Sparkles } from 'lucide-react';

export function Hero({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Gestion de la touche Échap et du blocage du scroll de fond
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsInvoiceModalOpen(false);
    };
    if (isInvoiceModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isInvoiceModalOpen]);

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

        {/* CTAs principaux côte à côte (sur téléphone, tablette et ordinateur) */}
        <div className="mt-3.5 sm:mt-6 flex flex-row items-center justify-center gap-2 sm:gap-3">
          <Link href={`/${locale}/register` as Route} className="w-auto">
            <Button
              size="lg"
              className="min-h-[40px] sm:min-h-[50px] px-3.5 sm:px-8 gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-xs sm:text-base whitespace-nowrap"
            >
              <span>{isFr ? 'Essayer gratuitement' : 'Try for free'}</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          
          <a href="#demo" className="w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="min-h-[40px] sm:min-h-[50px] px-3 sm:px-6 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 text-xs sm:text-sm shadow-xs whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
              <span>{isFr ? 'Voir la démo' : 'Watch live demo'}</span>
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

        {/* Aperçu Mobile Réaliste : Kmer Chic Boutique (< 640px) - CLIQUABLE */}
        <div className="sm:hidden mx-auto mt-4 max-w-sm">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsInvoiceModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsInvoiceModalOpen(true);
            }}
            className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-lg ring-1 ring-black/5 cursor-pointer hover:border-emerald-500 hover:shadow-xl transition-all duration-200 active:scale-[0.98] group"
          >
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

            {/* Pastille d'invitation au clic sur mobile */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{isFr ? 'Voir la facture pro officielle (A4)' : 'View full official invoice (A4)'}</span>
              </span>
              <span className="text-xs">➔</span>
            </div>
          </div>
        </div>

        {/* Aperçu Desktop Réaliste : Option A Kmer Chic Boutique (>= 640px) - CLIQUABLE */}
        <div className="hidden sm:block relative mx-auto mt-8 max-w-lg">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsInvoiceModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsInvoiceModalOpen(true);
            }}
            className="relative rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 cursor-pointer hover:border-emerald-500/80 hover:shadow-emerald-900/10 hover:shadow-2xl transition-all duration-200 group"
          >
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

            {/* Invitation au clic sur Desktop */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{isFr ? 'Cliquer pour ouvrir la facture pro complète (format A4 officiel)' : 'Click to open full official A4 invoice'}</span>
              </span>
              <span className="text-[11px] bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                Aperçu Pro ➔
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            MODALE PLEIN FORMAT : FACTURE PRO OFFICIELLE (A4)
            ======================================================== */}
        {isInvoiceModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-invoice-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          >
            {/* Fond assombri avec flou */}
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
              onClick={() => setIsInvoiceModalOpen(false)}
              aria-hidden="true"
            />

            {/* Conteneur principal de la modale */}
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-slate-200 text-left z-10 space-y-6">
              
              {/* Barre supérieure d'action & fermeture */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span id="modal-invoice-title" className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    {isFr ? 'Facture Pro Officielle · Format A4 Conforme OHADA' : 'Official Pro Invoice · OHADA Compliant A4 Format'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  aria-label="Fermer"
                  className="rounded-full p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* FEUILLE DE FACTURE OFFICIELLE (Style Papier Pro) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5">
                
                {/* 1. En-tête : Émetteur & Numéro officiel */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                      Kmer Chic Boutique SARL
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      Prêt-à-porter féminin &amp; Maroquinerie artisanale de luxe
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rue des Cocotiers, Akwa, Douala — Cameroun
                    </p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono space-y-0.5">
                      <p><strong>NIU :</strong> M052300045812Z · <strong>RCCM :</strong> RC/DLA/2023/B/1429</p>
                      <p><strong>Régime fiscal :</strong> Impôt Libératoire (Exonéré de TVA selon Art. 128 CGI)</p>
                      <p><strong>Contact :</strong> +237 690 00 00 00 · contact@kmerchic.cm</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-block rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
                      {isFr ? 'FACTURE OFFICIELLE' : 'OFFICIAL INVOICE'}
                    </span>
                    <p className="mt-2 text-sm font-mono font-extrabold text-slate-900">
                      FA-2026-0042
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isFr ? 'Date :' : 'Date:'} <strong>10 Novembre 2026</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ● {isFr ? 'Paiement à réception (24h)' : 'Due on receipt (24h)'}
                    </p>
                  </div>
                </div>

                {/* 2. Coordonnées de la cliente (Facturé à) */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isFr ? 'FACTURÉ À / CLIENT :' : 'BILLED TO / CLIENT:'}
                  </p>
                  <p className="text-sm font-bold text-slate-950 mt-1">Mme Estelle Ndongo</p>
                  <p className="text-slate-600 mt-0.5">Quartier Bonanjo, Douala — Cameroun</p>
                  <p className="text-slate-500 font-mono mt-0.5">Tel : +237 670 00 00 00</p>
                </div>

                {/* 3. Tableau des articles avec mentions comptables complètes */}
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-100/90 py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <span className="col-span-6">{isFr ? 'Désignation des prestations / articles' : 'Description / Items'}</span>
                    <span className="col-span-2 text-center">{isFr ? 'Qté' : 'Qty'}</span>
                    <span className="col-span-4 text-right">{isFr ? 'Total HT' : 'Total HT'}</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    <div className="grid grid-cols-12 items-center py-2.5 px-3">
                      <div className="col-span-6 pr-2">
                        <p className="font-bold text-slate-900">Robe soirée Soie &amp; Wax brodé main</p>
                        <p className="text-[10px] text-slate-500">Taille M · Modèle exclusif collection 2026</p>
                      </div>
                      <span className="col-span-2 text-center font-mono text-slate-700">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        45 000 FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-12 items-center py-2.5 px-3">
                      <div className="col-span-6 pr-2">
                        <p className="font-bold text-slate-900">Sac à main cuir artisanal finition or brossé</p>
                        <p className="text-[10px] text-slate-500">Cuir véritable tannage végétal</p>
                      </div>
                      <span className="col-span-2 text-center font-mono text-slate-700">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        30 000 FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-12 items-center py-2.5 px-3">
                      <div className="col-span-6 pr-2">
                        <p className="font-bold text-slate-900">Livraison express coursier sécurisé</p>
                        <p className="text-[10px] text-slate-500">Trajet Akwa ➔ Bonanjo (Douala)</p>
                      </div>
                      <span className="col-span-2 text-center font-mono text-slate-700">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        2 500 FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Récapitulatif des montants & Total Net à payer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span>Total Brut HT :</span>
                    <span className="font-mono font-semibold">77 500 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span>TVA (0% — Régime Simplifié) :</span>
                    <span className="font-mono">0 FCFA</span>
                  </div>
                  
                  {/* Total Net */}
                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-4 text-white shadow-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                        {isFr ? 'NET À PAYER' : 'TOTAL DUE'}
                      </span>
                      <span className="text-xs text-emerald-100 font-medium">Soixante-dix-sept mille cinq cents FCFA</span>
                    </div>
                    <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight">
                      77 500 FCFA
                    </span>
                  </div>
                </div>

                {/* 5. Coordonnées de paiement direct vendeur */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-slate-800 space-y-1.5">
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>💳</span> {isFr ? 'Instructions de règlement direct :' : 'Direct payment instructions:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-orange-600 font-bold block">🟠 Orange Money</span>
                      <strong>+237 690 00 00 00</strong>
                      <span className="text-[10px] text-slate-500 block">Kmer Chic Boutique</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-amber-600 font-bold block">🟡 MTN MoMo</span>
                      <strong>+237 670 00 00 00</strong>
                      <span className="text-[10px] text-slate-500 block">Kmer Chic Boutique</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    * Merci d&apos;indiquer la référence « FA-2026-0042 » lors de votre transfert Mobile Money.
                  </p>
                </div>

                {/* 6. Authenticité : Cachet officiel, Signature & QR Code */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                  {/* QR Code de vérification */}
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-auto">
                    <div className="h-12 w-12 p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                      <QrCode className="h-10 w-10 text-slate-800" />
                    </div>
                    <div className="text-[10px] leading-tight text-slate-600">
                      <p className="font-bold text-slate-900">QR Code d&apos;Authenticité</p>
                      <p className="text-slate-400 font-mono mt-0.5">ID: MCB-2026-KMER42</p>
                      <p className="text-emerald-700 font-semibold mt-0.5">✓ Conforme OHADA</p>
                    </div>
                  </div>

                  {/* Cachet & Signature */}
                  <div className="flex items-center gap-3">
                    {/* Cachet circulaire simulé */}
                    <div className="relative inline-flex items-center justify-center p-1 rounded-full border-2 border-dashed border-indigo-700/60 text-indigo-800 rotate-[-8deg] bg-indigo-50/40">
                      <div className="w-20 h-20 rounded-full border border-indigo-600/40 flex flex-col items-center justify-center text-center p-1">
                        <span className="text-[6.5px] font-black uppercase tracking-wider">KMER CHIC BOUTIQUE</span>
                        <span className="text-[5.5px] font-bold text-indigo-600">DOUALA · AKWA</span>
                        <span className="text-[7.5px] font-extrabold text-indigo-900 my-0.5">✓ CERTIFIÉ</span>
                        <span className="text-[5.5px] text-indigo-500 font-mono">OHADA 2026</span>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-slate-500">Pour la Direction :</p>
                      <svg viewBox="0 0 100 40" className="h-8 w-24 text-indigo-900" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 25 C25 10, 30 35, 45 15 C55 5, 50 30, 70 20 C80 15, 85 28, 95 18" />
                        <path d="M20 32 C40 30, 70 33, 90 28" strokeWidth="1.5" />
                      </svg>
                      <p className="text-[9px] text-slate-400 font-mono">E. Ndongo (Gérante)</p>
                    </div>
                  </div>
                </div>

                {/* 7. Mention légale de pied de page */}
                <p className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                  Document officiel édité avec le logiciel MyCashBill · Conforme aux exigences de l&apos;Acte Uniforme OHADA
                </p>

              </div>

              {/* Bannière d'incitation & Inscription */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>{isFr ? 'Envoyez des factures aussi pros à vos clients' : 'Send invoices this professional to your clients'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isFr ? '10 documents offerts par mois · Sans carte bancaire' : '10 free documents/month · No credit card required'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Link href={`/${locale}/register` as Route} className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-4 py-2 text-xs shadow-md"
                      onClick={() => setIsInvoiceModalOpen(false)}
                    >
                      <span>{isFr ? 'Créer mes factures gratuitement' : 'Create my invoices for free'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
}
