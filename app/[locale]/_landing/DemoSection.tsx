'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function DemoSection({
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const router = useRouter();
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewTier, setPreviewTier] = useState<'pro' | 'free'>('pro');

  const currencyLabel = 'FCFA';

  const applyExample = (exName: string, exService: string, exAmount: string) => {
    setName(exName);
    setService(exService);
    setAmount(exAmount);
  };

  const handleGenerate = async () => {
    const amountNum = parseInt(amount, 10);
    if (!name.trim() || !service.trim() || isNaN(amountNum) || amountNum <= 0) return;

    setLoading(true);
    try {
      await fetch('/api/register-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          name: name.trim(),
          service: service.trim(),
          amount: amountNum,
        }),
      });
      setGenerated(true);
    } catch {
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    router.push(`/${locale}/register?from=demo` as Route);
  };

  const parsedAmount = parseInt(amount, 10);
  const amountFormatted = !isNaN(parsedAmount)
    ? parsedAmount.toLocaleString(isFr ? 'fr-FR' : 'en-US')
    : '0';

  const dateFormatted = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section id="demo" className="bg-gradient-to-b from-white to-sage-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
            ⚡ {isFr ? 'Démonstrateur en direct' : 'Live Demonstrator'}
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-3xl">
            {isFr ? 'Essayez maintenant, sans inscription.' : 'Try now, no signup.'}
          </h2>
          <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm md:text-base">
            {isFr
              ? 'Remplissez 3 champs ou cliquez sur un exemple : admirez le rendu professionnel et comparez la version Gratuite vs Pro.'
              : 'Fill 3 fields or click an example: see the professional render and compare Free vs Pro.'}
          </p>
        </div>

        {!generated ? (
          <div className="surface mx-auto mt-8 max-w-md space-y-4 p-4 sm:p-6 shadow-xl border border-slate-200 rounded-2xl">
            {/* Suggestions rapides en 1 clic */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {isFr ? 'Exemples en 1 clic :' : '1-click examples:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyExample('Atelier Amina Couture', 'Confection ensemble sur mesure', '45000')}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-sage-400 hover:bg-sage-50 transition-colors"
                >
                  👗 Couture (45 000)
                </button>
                <button
                  type="button"
                  onClick={() => applyExample('Kemet Tech Solutions', 'Création application web & hébergement', '180000')}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-sage-400 hover:bg-sage-50 transition-colors"
                >
                  💻 Tech (180 000)
                </button>
                <button
                  type="button"
                  onClick={() => applyExample('DistriPlus SARL', 'Livraison lot fournitures de bureau', '75000')}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-sage-400 hover:bg-sage-50 transition-colors"
                >
                  📦 Commerce (75 000)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isFr ? 'Nom de votre entreprise ou activité' : 'Your business or personal name'}
              </label>
              <input
                placeholder={isFr ? 'Ex : Atelier Amina Couture' : 'e.g. Amina Fashion Studio'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm focus:border-sage-500 focus:ring-2 focus:ring-sage-100 focus:outline-none"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isFr ? 'Prestation ou marchandise vendue' : 'Service or goods sold'}
              </label>
              <input
                placeholder={isFr ? 'Ex : Confection ensemble 3 pièces' : 'e.g. 3-piece tailored suit'}
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm focus:border-sage-500 focus:ring-2 focus:ring-sage-100 focus:outline-none"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isFr ? 'Montant en FCFA' : 'Amount in FCFA'}
              </label>
              <input
                placeholder="Ex : 45000"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm focus:border-sage-500 focus:ring-2 focus:ring-sage-100 focus:outline-none"
                min="1"
              />
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handleGenerate}
              isLoading={loading}
              disabled={!name.trim() || !service.trim() || !amount}
              className="mt-2"
            >
              {isFr ? '⚡ Générer l’aperçu de ma facture' : '⚡ Generate my invoice preview'}
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-3xl space-y-6">
            {/* Contrôleur de comparaison Mode Gratuit vs Mode Pro */}
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPreviewTier('pro')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                    previewTier === 'pro'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  <span>✨</span>
                  <span>{isFr ? 'Mode Pro (Recommandé)' : 'Pro Mode (Recommended)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTier('free')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                    previewTier === 'free'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  <span>📄</span>
                  <span>{isFr ? 'Mode Gratuit (avec filigrane)' : 'Free Mode (Watermarked)'}</span>
                </button>
              </div>

              {/* Bandeau d'information explicatif sur la différence */}
              {previewTier === 'pro' ? (
                <div className="w-full rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-center text-xs text-emerald-900 font-medium">
                  🌟 <strong>{isFr ? 'Qualité Mode Pro :' : 'Pro Mode Quality:'}</strong>{' '}
                  {isFr
                    ? 'Zéro filigrane · Logo d’entreprise en haute résolution · Cachet officiel & signature · QR Code de vérification · Présentation haut de gamme qui rassure vos clients.'
                    : 'Zero watermark · High-res corporate logo · Official seal & signature · Verification QR Code · High-end layout that reassures clients.'}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-center text-xs text-amber-900 font-medium">
                  ⚠️ <strong>{isFr ? 'Mode Gratuit standard :' : 'Standard Free Mode:'}</strong>{' '}
                  {isFr
                    ? 'Filigrane « Créé avec MyCashBill » imposé · Pas de logo · Pas de cachet officiel · QR code d’authenticité désactivé. Idéal pour tester.'
                    : 'Watermark « Created with MyCashBill » applied · No logo · No official seal · Verification QR code disabled. Ideal for testing.'}
                </div>
              )}
            </div>

            {/* Facture Réelle conforme au SaaS A4 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-3.5 sm:p-8 shadow-2xl transition-all">
              {/* Filigrane en diagonale pour le Mode Gratuit UNIQUEMENT */}
              {previewTier === 'free' && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15 select-none"
                  aria-hidden="true"
                >
                  <div className="rotate-[-26deg] text-center border-4 border-dashed border-slate-500 p-6 rounded-2xl">
                    <p className="font-display text-3xl sm:text-4xl font-black text-slate-700 tracking-widest uppercase">
                      CRÉÉ AVEC MYCASHBILL
                    </p>
                    <p className="text-sm font-bold tracking-widest text-slate-500 uppercase mt-1">
                      VERSION GRATUITE · FILIGRANE SYSTÈME
                    </p>
                  </div>
                </div>
              )}

              {/* Barre supérieure */}
              <div
                className={`h-2 w-full rounded-t-lg mb-6 ${
                  previewTier === 'pro'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sage-600'
                    : 'bg-slate-400'
                }`}
              />

              {/* En-tête : Logo & Informations émetteur */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div>
                  {previewTier === 'pro' ? (
                    <div className="flex items-start gap-3">
                      {/* Logo officiel d'entreprise */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-base shadow-md ring-2 ring-emerald-100">
                        {name ? name.slice(0, 2).toUpperCase() : 'MB'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-ink tracking-tight">{name}</h3>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ {isFr ? 'Pro Certifié' : 'Pro Verified'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          NIU : M022417894521X · RCCM : RC/DLA/2026/B/0042
                        </p>
                        <p className="text-xs text-slate-400">
                          Douala / Yaoundé · Afrique Centrale · contact@{name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'entreprise'}.com
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Placeholder logo absent en Gratuit */}
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-400">
                        <span>🚫</span>
                        <span>{isFr ? 'Logo indisponible en version gratuite' : 'Logo unavailable in free tier'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-ink">{name}</h3>
                      <p className="text-xs text-slate-500">Douala / Yaoundé</p>
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span
                    className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${
                      previewTier === 'pro'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {previewTier === 'pro'
                      ? isFr
                        ? 'FACTURE OFFICIELLE'
                        : 'OFFICIAL INVOICE'
                      : isFr
                        ? 'FACTURE SIMPLE'
                        : 'SIMPLE INVOICE'}
                  </span>
                  <p className="mt-1 font-mono text-xs font-bold text-slate-700">N° FA-2026-0042</p>
                  <p className="text-xs text-slate-500">{dateFormatted}</p>
                  <p className="text-[11px] text-slate-400">{isFr ? 'Paiement à réception' : 'Due on receipt'}</p>
                </div>
              </div>

              {/* Bloc Client Destinataire */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isFr ? 'Facturé à :' : 'Billed to:'}
                </p>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-sm font-bold text-ink">Société Partenaire Commerciale SARL</p>
                  <span className="text-xs text-slate-500">{isFr ? 'Client Professionnel' : 'Corporate Client'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Quartier Bonanjo, Douala · Cameroun</p>
              </div>

              {/* Table des prestations */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="pb-3">{isFr ? 'Désignation de la prestation' : 'Service description'}</th>
                      <th className="pb-3 text-center">{isFr ? 'Qté' : 'Qty'}</th>
                      <th className="pb-3 text-right">{isFr ? 'Prix unitaire' : 'Unit price'}</th>
                      <th className="pb-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-ink">{service}</p>
                        {previewTier === 'pro' && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isFr ? 'Livrable conforme aux spécifications contractuelles' : 'Deliverable conforming to contractual specs'}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 text-center text-slate-600">1</td>
                      <td className="py-3.5 text-right text-slate-600 font-mono">
                        {amountFormatted} {currencyLabel}
                      </td>
                      <td className="py-3.5 text-right font-bold text-ink font-mono">
                        {amountFormatted} {currencyLabel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totaux & Règlement */}
              <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                <div className="w-full max-w-[260px] space-y-2 text-right">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isFr ? 'Sous-total HT :' : 'Subtotal:'}</span>
                    <span className="font-mono">{amountFormatted} {currencyLabel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isFr ? 'TVA (Régime simplifié) :' : 'VAT:'}</span>
                    <span className="font-mono italic">{isFr ? 'Exonéré (0%)' : 'Exempt (0%)'}</span>
                  </div>
                  <div
                    className={`flex justify-between items-baseline border-t-2 pt-2.5 text-base sm:text-lg font-extrabold ${
                      previewTier === 'pro'
                        ? 'border-emerald-600 text-emerald-900'
                        : 'border-slate-800 text-ink'
                    }`}
                  >
                    <span>NET À PAYER :</span>
                    <span className="font-mono">{amountFormatted} {currencyLabel}</span>
                  </div>
                </div>
              </div>

              {/* Pied de facture : Différence majeure Pro vs Gratuit */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  {/* Coordonnées de règlement renseignées par l'émetteur pour son client */}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-700">
                      {isFr ? 'Instructions de règlement client :' : 'Client payment instructions:'}
                    </p>
                    <p className="text-slate-600">
                      📲 MTN MoMo / Orange Money / Wave : <span className="font-semibold text-ink">+237 6XX XX XX XX</span>
                    </p>
                    <p className="text-slate-600">
                      🏦 Virement bancaire (coordonnées RIB sur demande)
                    </p>
                    <p className="text-[10px] text-slate-400 italic pt-1">
                      {isFr
                        ? 'Vos coordonnées de règlement personnalisées s’affichent directement sur vos documents.'
                        : 'Your personalized payment instructions appear directly on your invoices.'}
                    </p>
                  </div>

                  {/* Cachet, signature et QR Code (Inclus en Pro, désactivés en Gratuit) */}
                  <div className="flex items-center justify-end gap-4">
                    {previewTier === 'pro' ? (
                      <>
                        {/* QR Code de vérification Pro */}
                        <div className="text-center">
                          <div className="inline-block rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                            <svg className="w-14 h-14 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm-4-2h2v4h-2v-4zm2 4h2v4h-2v-4zm2 2h2v2h-2v-2zm0-6h4v2h-4v-2zm-6 0h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                            </svg>
                          </div>
                          <p className="mt-1 text-[9px] font-bold text-emerald-800">
                            ✓ {isFr ? 'Certifié Sécurisé' : 'Verified Secure'}
                          </p>
                        </div>

                        {/* Cachet officiel et Signature Pro */}
                        <div className="relative text-center">
                          <div className="relative inline-block">
                            {/* Cachet rond en SVG */}
                            <svg className="w-24 h-24 text-blue-700/80 rotate-[-8deg]" viewBox="0 0 120 120">
                              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
                              <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              <path id="circlePath" fill="none" d="M 18,60 A 42,42 0 1,1 102,60 A 42,42 0 1,1 18,60" />
                              <text className="text-[8px] font-bold uppercase tracking-widest" fill="currentColor">
                                <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
                                  DIRECTION COMMERCIALE • REÇU ET APPROUVÉ
                                </textPath>
                              </text>
                              <text x="60" y="55" textAnchor="middle" className="text-[10px] font-black uppercase tracking-wider" fill="currentColor">
                                CACHET
                              </text>
                              <text x="60" y="68" textAnchor="middle" className="text-[10px] font-black uppercase tracking-wider" fill="currentColor">
                                OFFICIEL
                              </text>
                              <text x="60" y="80" textAnchor="middle" className="text-[8px] font-semibold" fill="currentColor">
                                VALIDÉ
                              </text>
                            </svg>
                            {/* Signature manuscrite stylisée par-dessus */}
                            <svg className="absolute inset-0 w-24 h-24 text-blue-900/90 pointer-events-none" viewBox="0 0 100 100">
                              <path d="M20 60 Q35 30 50 55 T75 40 T90 65" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <p className="text-[9px] font-semibold text-slate-500">
                            {isFr ? 'Signature & Cachet d’entreprise' : 'Corporate Seal & Signature'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-400">
                        <p className="font-semibold text-slate-500">
                          {isFr ? 'Cachet & Signature réservés au statut Pro' : 'Seal & Signature reserved for Pro'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isFr ? 'Activable pour 2 000 FCFA/mois' : 'Available for 2,000 FCFA/month'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action et conversion */}
            <div className="rounded-2xl border-2 border-sage-500 bg-white p-6 shadow-xl text-center space-y-3">
              <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
                🎉 {isFr ? 'Votre facture est prête !' : 'Your invoice is ready!'}
              </span>
              <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                {isFr
                  ? 'Conservez ce document et commencez à facturer sereinement.'
                  : 'Save this document and start billing with confidence.'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                {isFr
                  ? 'Créez votre compte gratuit en 30 secondes pour sauvegarder cette facture, l’exporter en PDF ou l’envoyer à votre client par WhatsApp. Passez Pro à tout moment pour supprimer définitivement le filigrane.'
                  : 'Create your free account in 30 seconds to save this invoice, download PDF or send via WhatsApp. Upgrade to Pro anytime to remove watermarks permanently.'}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="min-w-[240px]" onClick={handleUnlock}>
                  {isFr
                    ? '💾 Conserver ma facture (Gratuit)'
                    : '💾 Save my invoice (Free)'}
                </Button>
                <button
                  type="button"
                  onClick={() => setGenerated(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-ink underline py-2"
                >
                  {isFr ? '✏️ Modifier les informations' : '✏️ Edit details'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFr
                  ? '✓ Plan gratuit à 10 factures/mois · ✓ Sans carte requise · ✓ Paiements sécurisés via Notch Pay'
                  : '✓ Free plan with 10 invoices/month · ✓ No card required · ✓ Secure payments via Notch Pay'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}