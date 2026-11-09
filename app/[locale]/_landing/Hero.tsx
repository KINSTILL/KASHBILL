'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

type DocType = 'invoice' | 'quote' | 'delivery' | 'receipt';

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
    device === 'android' ? 'Android' : device === 'ios' ? 'iPhone' : isFr ? 'smartphone' : 'smartphone';

  const [activeDoc, setActiveDoc] = useState<DocType>('invoice');
  const [previewTier, setPreviewTier] = useState<'pro' | 'free'>('pro');

  const badge =
    tier === 'tier1'
      ? isFr
        ? `${country.flag} Conçu pour ${country.name} · Devis, Factures & Livraisons conformes`
        : `${country.flag} Built for ${country.name} · Professional Quotes, Invoices & Delivery`
      : isFr
        ? '🌍 Panafricain · Facturation conforme OHADA, devis & reçus'
        : '🌍 Pan-African · OHADA-compliant invoicing, quotes & receipts';

  // Contenus et douleurs spécifiques par type de document
  const docsData = {
    quote: {
      label: isFr ? 'Devis' : 'Quote',
      icon: '📄',
      num: 'DE-2026-0018',
      badge: isFr ? 'Devis Officiel' : 'Official Quote',
      title: isFr ? 'Confection & Prestations sur mesure' : 'Custom Tailoring & Service',
      client: isFr ? 'Client : Mme Estelle Ndongo' : 'Client: Estelle Ndongo',
      pain: isFr
        ? '🚫 Fini le prospect qui demande un devis officiel et disparaît face à un simple message WhatsApp. Signez vos commandes 2x plus vite avec un devis pro chiffré.'
        : '🚫 No more lost prospects asking for an official quote and ghosting after receiving a plain WhatsApp text. Close deals 2x faster with clean quotes.',
      items: [
        { name: isFr ? 'Confection ensemble 3 pièces sur mesure' : 'Custom 3-piece tailored outfit', amount: '85 000 FCFA' },
        { name: isFr ? 'Fourniture tissus & finitions brodées' : 'Premium fabric & embroidery finish', amount: '40 000 FCFA' },
      ],
      total: '125 000 FCFA',
      note: isFr ? 'Validité : 15 jours · Acompte de 50% au lancement' : 'Validity: 15 days · 50% deposit on order',
    },
    invoice: {
      label: isFr ? 'Facture' : 'Invoice',
      icon: '🧾',
      num: 'FA-2026-0042',
      badge: isFr ? 'Facture Officielle' : 'Official Invoice',
      title: isFr ? 'Prestations & Fournitures Pro' : 'Professional Services & Supplies',
      client: isFr ? 'Client : Société ABC Partenaire SARL' : 'Client: ABC Partner LLC',
      pain: isFr
        ? '🚫 Fini les retards de paiement de 3 semaines et les négociations à la baisse. Une facture conforme avec mentions OHADA impose le respect et le paiement immédiat.'
        : '🚫 No more 3-week payment delays or endless price bargaining. A compliant invoice commands respect and instant payment.',
      items: [
        { name: isFr ? 'Prestation commerciale & Accompagnement' : 'Business consulting & delivery', amount: '150 000 FCFA' },
        { name: isFr ? 'Livrables techniques certifiés conformes' : 'Certified technical deliverables', amount: '50 000 FCFA' },
      ],
      total: '200 000 FCFA',
      note: isFr ? 'Paiement à réception · Coordonnées de règlement au bas du document' : 'Due on receipt · Payment instructions below',
    },
    delivery: {
      label: isFr ? 'Bon de Livraison' : 'Delivery Note',
      icon: '📦',
      num: 'BL-2026-0105',
      badge: isFr ? 'E-commerce & Colis' : 'Delivery & E-commerce',
      title: isFr ? 'Bordereau d’expédition & Colis' : 'Package Dispatch & Delivery slip',
      client: isFr ? 'Destinataire : M. Patrick Manga' : 'Recipient: Patrick Manga',
      pain: isFr
        ? '🚫 Fini les colis refusés et les litiges à la livraison. Le livreur moto remet la marchandise avec un bon de commande officiel signé qui prouve la commande et le prix.'
        : '🚫 No more refused packages and delivery disputes. The courier delivers with an official signed slip that proves the order and exact price.',
      items: [
        { name: isFr ? 'Colis : Robe drapée soirée (Taille M, Bordeaux)' : 'Parcel: Evening draped dress (Size M, Burgundy)', amount: '38 000 FCFA' },
        { name: isFr ? 'Frais de livraison express coursier moto' : 'Express motorbike courier delivery fee', amount: '2 500 FCFA' },
      ],
      total: '40 500 FCFA',
      note: isFr ? 'Colis vérifié conforme · Émargement du destinataire requis à la réception' : 'Goods verified in good order · Recipient signature required on delivery',
    },
    receipt: {
      label: isFr ? 'Reçu d’encaissement' : 'Payment Receipt',
      icon: '💳',
      num: 'RC-2026-0089',
      badge: isFr ? 'Règlement Encaissé ✓' : 'Payment Cleared ✓',
      title: isFr ? 'Reçu de règlement libératoire' : 'Official Discharge Payment Receipt',
      client: isFr ? 'Client : Entreprise Partenaire SARL' : 'Client: Partner Company LLC',
      pain: isFr
        ? '🚫 Fini le carnet de reçu papier carbone qui tache les doigts et qu’on égare. Rassurez immédiatement votre client avec un reçu numérique irréfutable dès qu’il a payé.'
        : '🚫 No more messy carbon-paper receipt books that get lost. Reassure your client instantly with a digital proof of payment sent on WhatsApp.',
      items: [
        { name: isFr ? 'Règlement intégral de la Facture N° FA-2026-0042' : 'Full payment of Invoice # FA-2026-0042', amount: '200 000 FCFA' },
        { name: isFr ? 'Mode : Mobile Money (Réf. transaction TRX-9841)' : 'Method: Mobile Money (Ref. TRX-9841)', amount: isFr ? 'Réglé 100%' : '100% Paid' },
      ],
      total: isFr ? '200 000 FCFA (Payé)' : '200,000 FCFA (Paid)',
      note: isFr ? 'Solde restant dû : 0 FCFA · Quittance de règlement définitive' : 'Remaining balance: 0 FCFA · Final proof of payment',
    },
  };

  const currentDoc = docsData[activeDoc];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sage-50 to-white px-4 pt-16 pb-20">
      <div className="mx-auto max-w-5xl">
        {fromWhatsApp && (
          <div className="mb-6 rounded-full bg-whatsapp/10 px-4 py-2 text-center text-sm text-whatsapp-dark font-medium">
            💬 {isFr ? 'Vous vendez sur WhatsApp ? Créez et envoyez vos factures en 1 min chrono.' : "Selling on WhatsApp? Create and send invoices in 1 min."}
          </div>
        )}

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm border border-slate-100">
            {badge}
          </span>

          {/* Titre percutant axé sur la douleur des entrepreneurs */}
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
            {isFr
              ? 'Vos clients hésitent à vous payer ? Envoyez des documents qui imposent le respect.'
              : 'Clients hesitate to pay you? Send documents that command respect.'}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            {isFr
              ? `Devis, factures, reçus et bons de livraison générés en 47 secondes sur votre ${deviceLabel}. Envoyez sur WhatsApp, faites-vous payer sans délai et sans négociation.`
              : `Compliant quotes, invoices, delivery notes and receipts generated in 47 seconds on your ${deviceLabel}. Share via WhatsApp, get paid on time.`}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/register` as Route}>
              <Button size="lg" className="min-w-[220px]">
                {isFr ? 'Commencer gratuitement' : 'Start for free'}
              </Button>
            </Link>
            <a href="#demo">
              <Button size="lg" variant="secondary" className="min-w-[220px]">
                {isFr ? '⚡ Tester la démo sans inscription' : '⚡ Try demo without signup'}
              </Button>
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {isFr
              ? '✓ Plan gratuit immédiat (10 docs/mois)  ·  ✓ Sans carte bancaire requise  ·  ✓ Vos clients règlent sur vos coordonnées'
              : '✓ Immediate free plan (10 docs/mo)  ·  ✓ No card required  ·  ✓ Clients pay directly to your accounts'}
          </p>
        </div>

        {/* HUB DOCUMENTAIRE 4-EN-1 : L'encadré qui traite directement les douleurs */}
        <div className="mx-auto mt-12 max-w-3xl">
          {/* Sélecteur de type de document (Hub 4-en-1) */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {(['invoice', 'quote', 'delivery', 'receipt'] as DocType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveDoc(type)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeDoc === type
                    ? 'bg-ink text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{docsData[type].icon}</span>
                <span>{docsData[type].label}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Barre supérieure : Commutateur Mode Gratuit vs Mode Pro */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <span className="text-xs font-bold text-slate-700">
                  {isFr ? 'Aperçu Document MyCashBill' : 'MyCashBill Document Preview'}
                </span>
                <span className="rounded bg-sage-100 px-2 py-0.5 text-[10px] font-bold text-sage-800">
                  ⚡ 47s chrono
                </span>
              </div>

              {/* Toggle interactif Gratuit vs Pro */}
              <div className="inline-flex rounded-lg bg-slate-200/80 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewTier('pro')}
                  className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                    previewTier === 'pro'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  ✨ {isFr ? 'Rendu Pro (Logo + Cachet)' : 'Pro Render (Logo + Stamp)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTier('free')}
                  className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                    previewTier === 'free'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  📄 {isFr ? 'Rendu Gratuit (Filigrane)' : 'Free Render'}
                </button>
              </div>
            </div>

            {/* BANDEAU DE LA DOULEUR TRAITÉE (Spécifique au document choisi) */}
            <div className="bg-amber-50/90 border-b border-amber-100 px-4 py-2.5 sm:px-6 text-xs text-amber-900 font-medium flex items-start gap-2">
              <span className="text-base shrink-0">💡</span>
              <p className="leading-snug">{currentDoc.pain}</p>
            </div>

            {/* CORPS DU DOCUMENT SIMULÉ */}
            <div className="relative p-5 sm:p-7 space-y-5">
              {/* Filigrane en diagonale pour le Mode Gratuit */}
              {previewTier === 'free' && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none"
                  aria-hidden="true"
                >
                  <p className="rotate-[-25deg] text-center font-display text-3xl sm:text-4xl font-black text-slate-800 tracking-widest uppercase">
                    CRÉÉ AVEC MYCASHBILL<br />VERSION GRATUITE
                  </p>
                </div>
              )}

              {/* En-tête du document */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  {previewTier === 'pro' ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-sm shadow-md ring-2 ring-emerald-100">
                      MB
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400 font-medium text-center">
                      Sans logo
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded bg-sage-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sage-800">
                        {currentDoc.num}
                      </span>
                      {previewTier === 'pro' && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          ✓ {isFr ? 'Certifié Pro' : 'Pro Verified'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm sm:text-base font-bold text-ink">
                      {currentDoc.title}
                    </p>
                    <p className="text-xs text-slate-500">{currentDoc.client}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      previewTier === 'pro' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentDoc.badge}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Lignes du document */}
              <div className="rounded-xl bg-slate-50 p-3 sm:p-4 text-xs sm:text-sm space-y-2">
                {currentDoc.items.map((it, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center ${
                      idx !== currentDoc.items.length - 1 ? 'pb-2 border-b border-slate-200/80' : ''
                    }`}
                  >
                    <span className="text-slate-700 font-medium">{it.name}</span>
                    <span className="font-bold text-ink font-mono">{it.amount}</span>
                  </div>
                ))}
              </div>

              {/* Total & Cachet Pro */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                <div className="space-y-0.5 text-xs text-slate-500">
                  <p className="font-medium text-slate-700">
                    {isFr ? 'Instructions de règlement vendeur :' : 'Seller payment instructions:'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    MTN MoMo · Orange Money · Wave · Coordonnées bancaires
                  </p>
                  <p className="text-[10px] text-slate-400 italic pt-0.5">{currentDoc.note}</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Cachet et signature visibles UNIQUEMENT en Pro */}
                  {previewTier === 'pro' && (
                    <div className="relative text-center shrink-0">
                      <div className="relative inline-block">
                        <svg className="w-16 h-16 text-blue-700/80 rotate-[-8deg]" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
                          <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <text x="60" y="55" textAnchor="middle" className="text-[10px] font-black uppercase" fill="currentColor">
                            CACHET
                          </text>
                          <text x="60" y="68" textAnchor="middle" className="text-[10px] font-black uppercase" fill="currentColor">
                            OFFICIEL
                          </text>
                        </svg>
                        <svg className="absolute inset-0 w-16 h-16 text-blue-900/90 pointer-events-none" viewBox="0 0 100 100">
                          <path d="M20 60 Q35 30 50 55 T75 40 T90 65" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="text-[8px] font-semibold text-slate-500">{isFr ? 'Cachet & Signature' : 'Seal & Signature'}</p>
                    </div>
                  )}

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                      {isFr ? 'Total Net' : 'Total Due'}
                    </span>
                    <span className="text-xl font-extrabold text-ink sm:text-2xl font-mono">
                      {currentDoc.total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions de partage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href="#demo"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <span>📲</span>
                  <span>{isFr ? 'Générer ce document avec mes infos' : 'Generate this document with my details'}</span>
                </a>
                <Link
                  href={`/${locale}/register` as Route}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <span>⭐</span>
                  <span>{isFr ? 'Débloquer le Mode Pro (2 000 FCFA)' : 'Unlock Pro Mode (2,000 FCFA)'}</span>
                </Link>
              </div>
            </div>

            {/* Note de réassurance sous la carte */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-500">
              {isFr
                ? '💡 En passant Pro pour 2 000 FCFA/mois (soit 66 FCFA/jour via Notch Pay sans engagement), retirez le filigrane et intégrez votre propre logo et cachet sur tous vos documents.'
                : '💡 Go Pro for 2,000 FCFA/month (about 66 FCFA/day via Notch Pay with no forced renewal), remove watermarks and use your official logo and stamp.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}