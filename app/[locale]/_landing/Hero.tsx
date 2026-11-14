'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, X, Eye, Sparkles } from 'lucide-react';

export function Hero({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Télécharge le PDF d'exemple (rendu par le moteur PDF du SaaS).
  const downloadSampleInvoice = () => {
    const link = document.createElement('a');
    link.href = '/api/samples/invoice';
    link.download = 'facture-exemple-mycashbill.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Clic sur la carte : téléchargement automatique, puis aperçu du même PDF dans la modale.
  const openSampleInvoice = () => {
    downloadSampleInvoice();
    setDownloadStarted(true);
    setIsInvoiceModalOpen(true);
  };

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
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white px-3 sm:px-6 pt-5 pb-10 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
      {/* Lueur de fond ultra-douce */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[380px] max-w-5xl rounded-full bg-gradient-to-tr from-emerald-400/12 via-teal-300/8 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* COLONNE GAUCHE (PC) / HAUT (Mobile & Tablette) : Proposition de valeur & Actions */}
          <div className="text-center lg:col-span-7 lg:text-left">
            {/* Badge de valeur épuré */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/70 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-900">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                {isFr
                  ? '⚡ Devis & Factures en 60s sur smartphone'
                  : '⚡ Quotes & Invoices in 60s on smartphone'}
              </span>
            </div>

            {/* Titre SEO en forme de question percutante */}
            <h1 className="mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-5xl lg:text-[44px] xl:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.18] sm:leading-[1.12]">
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

            {/* Sous-titre avec mots-clés longue traîne ciblés */}
            <p className="mx-auto lg:mx-0 mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base text-slate-600 leading-relaxed">
              {isFr
                ? "L'application de facturation pour e-commerçants et prestataires de services. Créez vos devis, factures et reçus en 60 secondes sur smartphone et partagez le PDF sur WhatsApp."
                : 'The invoicing app for online sellers and service professionals. Create quotes, invoices and receipts in 60 seconds on mobile and share the PDF on WhatsApp.'}
            </p>

            {/* CTAs principaux côte à côte (placés immédiatement après le sous-titre pour aérer la lecture) */}
            <div className="mt-5 sm:mt-6 flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
              <Link href={`/${locale}/register` as Route} className="w-auto">
                <Button
                  size="lg"
                  className="min-h-[42px] sm:min-h-[50px] px-4 sm:px-7 gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-xs sm:text-base whitespace-nowrap"
                >
                  <span>{isFr ? 'Essayer gratuitement' : 'Try for free'}</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>

              <a href="#demo" className="w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-h-[42px] sm:min-h-[50px] px-3.5 sm:px-6 border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 text-xs sm:text-sm shadow-2xs whitespace-nowrap"
                >
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                  <span>{isFr ? 'Voir la démo' : 'Watch live demo'}</span>
                </Button>
              </a>
            </div>

            {/* Micro-preuves de confiance SANS boîtes encadrées (zéro surcharge visuelle) */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{isFr ? '5 docs offerts/mois' : '5 free docs/mo'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{isFr ? 'Sans carte bancaire' : 'No credit card'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{isFr ? '100% Conforme OHADA' : '100% OHADA Compliant'}</span>
              </span>
            </div>

            {/* Lien direct de connexion */}
            <p className="mt-2.5 text-center lg:text-left text-xs text-slate-500">
              {isFr ? 'Déjà inscrit ? ' : 'Already registered? '}
              <Link
                href={`/${locale}/login` as Route}
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                {isFr ? 'Se connecter à mon compte' : 'Log in to my account'}
              </Link>
            </p>

            {/* Pastilles des 7 types de documents cliquables (#demo) en ruban doux sans ombres lourdes */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <ul
                aria-label={isFr ? 'Types de documents générables' : 'Supported document types'}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5"
              >
                {documentTypes.map((doc, idx) => (
                  <li key={idx}>
                    <a
                      href="#demo"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors active:scale-95"
                    >
                      <span>{doc.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COLONNE DROITE (PC) / BAS (Mobile & Tablette) : Aperçu Facture Cliquable */}
          <div className="lg:col-span-5">
            {/* Aperçu Mobile Réaliste : Kmer Chic Boutique (< 640px) - CLIQUABLE */}
            <div className="sm:hidden mx-auto max-w-sm">
              <div
                role="button"
                tabIndex={0}
                onClick={openSampleInvoice}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openSampleInvoice();
                }}
                className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-md ring-1 ring-black/5 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        Kmer Chic Boutique
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Facture FA-2026-0042 · Solange Ndongo</p>
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

            {/* Aperçu Tablette & Desktop Réaliste : Kmer Chic Boutique (>= 640px) - CLIQUABLE */}
            <div className="hidden sm:block relative mx-auto max-w-lg lg:max-w-none">
              <div
                role="button"
                tabIndex={0}
                onClick={openSampleInvoice}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openSampleInvoice();
                }}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-xl shadow-slate-900/5 ring-1 ring-black/5 cursor-pointer hover:border-emerald-500/80 hover:shadow-emerald-900/10 hover:shadow-2xl transition-all duration-200 group"
              >
                {/* En-tête de l'entreprise & Statut */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-slate-900">
                        Kmer Chic Boutique
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Douala, Akwa · Prêt-à-porter &amp; Accessoires
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/80">
                    {isFr ? '✓ Prête à envoyer' : '✓ Ready to send'}
                  </span>
                </div>

                {/* Client & Détails document */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                      {isFr ? 'Facturé à :' : 'Billed to:'}
                    </p>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">Mme Solange Ndongo</p>
                    <p className="text-[11px] text-slate-400">Bonanjo, Douala</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 font-mono text-[11px] font-bold text-slate-800 px-2 py-0.5 rounded">
                      FA-2026-0042
                    </span>
                    <p className="font-medium text-slate-600 text-[11px] mt-1">10 Nov 2026</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">{isFr ? '● Paiement à réception' : '● Due on receipt'}</p>
                  </div>
                </div>

                {/* Table d'articles avec en-têtes comptables clairs : Qté, Prix HT */}
                <div className="mt-3 rounded-xl border border-slate-200/80 overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <span className="col-span-6">{isFr ? 'Désignation / Article' : 'Item / Description'}</span>
                    <span className="col-span-2 text-center">{isFr ? 'Qté' : 'Qty'}</span>
                    <span className="col-span-4 text-right">{isFr ? 'Prix HT' : 'Price HT'}</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white text-[11px]">
                    <div className="grid grid-cols-12 items-center py-2 px-3">
                      <span className="col-span-6 font-medium text-slate-900 truncate">
                        Robe soirée Soie &amp; Wax brodé (M)
                      </span>
                      <span className="col-span-2 text-center font-mono text-slate-500">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        45 000 FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-12 items-center py-2 px-3">
                      <span className="col-span-6 font-medium text-slate-900 truncate">
                        Sac à main cuir artisanal finition or
                      </span>
                      <span className="col-span-2 text-center font-mono text-slate-500">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        30 000 FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-12 items-center py-2 px-3">
                      <span className="col-span-6 font-medium text-slate-900 truncate">
                        Livraison express coursier (Douala)
                      </span>
                      <span className="col-span-2 text-center font-mono text-slate-500">1</span>
                      <span className="col-span-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        2 500 FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total pro */}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2.5 text-white shadow-xs">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase text-emerald-100 block">
                      {isFr ? 'Total net à payer' : 'Total due'}
                    </span>
                    <span className="text-[10px] text-emerald-200">Règlement : Orange Money &amp; MTN MoMo</span>
                  </div>
                  <span className="font-mono text-xl font-extrabold tracking-tight">77 500 FCFA</span>
                </div>

                {/* Bulle d'envoi WhatsApp intégrée */}
                <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2 text-xs text-emerald-950 border border-emerald-100/80">
                  <span className="text-sm shrink-0">💬</span>
                  <p className="flex-1 truncate font-medium text-[11px]">
                    « Bonjour Mme Ndongo, voici votre facture officielle N° FA-2026-0042. Merci pour votre commande chez Kmer Chic ! »
                  </p>
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                    WhatsApp
                  </span>
                </div>

                {/* Invitation au clic sur Desktop */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isFr ? 'Télécharger & voir la facture PDF (A4)' : 'Download & view sample A4 PDF invoice'}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
                    Aperçu Pro ➔
                  </span>
                </div>
              </div>
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

              {/* APERÇU DU PDF RÉEL : même template A4 que les factures générées dans le SaaS */}
              <div className="space-y-3">
                {downloadStarted && (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p>
                      {isFr
                        ? 'Téléchargement lancé : la facture exemple est en cours d’enregistrement. Consultez votre dossier de téléchargements.'
                        : 'Download started: the sample invoice is being saved. Check your downloads folder.'}
                    </p>
                  </div>
                )}
                <iframe
                  src="/api/samples/invoice?inline=1#toolbar=0&navpanes=0"
                  title={isFr ? 'Facture exemple au format PDF' : 'Sample invoice in PDF'}
                  className="hidden sm:block w-full h-[68vh] rounded-2xl border border-slate-200 bg-slate-100"
                />
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
