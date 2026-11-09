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

  const currencyLabel = 'FCFA';

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

  return (
    <section id="demo" className="bg-gradient-to-b from-white to-sage-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
            {isFr ? 'Essayez maintenant, sans inscription.' : 'Try now, no signup.'}
          </h2>
          <p className="mt-2 text-slate-600">
            {isFr
              ? 'Remplissez 3 champs, voyez votre facture réelle, conservez-la en 30 sec.'
              : 'Fill 3 fields, see your real invoice, save it in 30 sec.'}
          </p>
        </div>

        {!generated ? (
          <div className="surface mx-auto mt-8 max-w-md space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {isFr ? 'Nom de votre entreprise ou activité' : 'Your business or personal name'}
              </label>
              <input
                placeholder={isFr ? 'Ex : Atelier Couture Amina' : 'e.g. Amina Fashion Studio'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sage-500 focus:outline-none"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {isFr ? 'Prestation vendue' : 'Service provided'}
              </label>
              <input
                placeholder={isFr ? 'Ex : Confection ensemble 3 pièces' : 'e.g. 3-piece tailored suit'}
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sage-500 focus:outline-none"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {isFr ? 'Montant en FCFA' : 'Amount in FCFA'}
              </label>
              <input
                placeholder="Ex : 25000"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sage-500 focus:outline-none"
                min="1"
              />
            </div>
            <Button
              fullWidth
              size="lg"
              onClick={handleGenerate}
              isLoading={loading}
              disabled={!name.trim() || !service.trim() || !amount}
            >
              {isFr ? '⚡ Générer l’aperçu de ma facture' : '⚡ Generate my invoice preview'}
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-2xl space-y-6">
            {/* Facture Réelle conforme au SaaS A4 */}
            <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white p-6 shadow-2xl sm:p-8">
              {/* Filigrane Gratuit bien visible (Biais de professionnalisme) */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none"
                aria-hidden="true"
              >
                <p className="rotate-[-28deg] text-center font-display text-4xl sm:text-5xl font-black text-slate-800 tracking-widest uppercase">
                  CRÉÉ AVEC MYCASHBILL<br />VERSION GRATUITE
                </p>
              </div>

              {/* Barre de couleur supérieure */}
              <div className="h-1.5 w-full bg-sage-600 rounded-t mb-6" />

              {/* En-tête émetteur & Document */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-ink">{name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Prestation de services & Facturation</p>
                  <p className="text-xs text-slate-400">Douala / Yaoundé · Afrique Centrale</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block rounded bg-sage-50 px-2.5 py-1 text-xs font-bold text-sage-800">
                    {isFr ? 'FACTURE PROFORMA' : 'INVOICE'}
                  </span>
                  <p className="mt-1 font-mono text-xs text-slate-500">N° FA-2026-0042</p>
                  <p className="text-xs text-slate-400">
                    {new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Bloc Client */}
              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {isFr ? 'Facturé à :' : 'Billed to:'}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">Client Particulier / Entreprise</p>
                <p className="text-xs text-slate-500">Paiement à réception</p>
              </div>

              {/* Table des lignes d'articles */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="pb-2">{isFr ? 'Désignation' : 'Description'}</th>
                      <th className="pb-2 text-center">{isFr ? 'Qté' : 'Qty'}</th>
                      <th className="pb-2 text-right">{isFr ? 'Prix unit.' : 'Unit Price'}</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 font-medium text-ink">{service}</td>
                      <td className="py-3 text-center text-slate-600">1</td>
                      <td className="py-3 text-right text-slate-600">{amountFormatted} {currencyLabel}</td>
                      <td className="py-3 text-right font-semibold text-ink">{amountFormatted} {currencyLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bloc Totaux */}
              <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                <div className="w-full max-w-[240px] space-y-1.5 text-right">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isFr ? 'Sous-total :' : 'Subtotal:'}</span>
                    <span>{amountFormatted} {currencyLabel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isFr ? 'TVA :' : 'VAT:'}</span>
                    <span className="italic">{isFr ? 'Non applicable' : 'Not applicable'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm sm:text-base font-bold text-ink">
                    <span>TOTAL :</span>
                    <span className="text-sage-700">{amountFormatted} {currencyLabel}</span>
                  </div>
                </div>
              </div>

              {/* Mentions de paiement et légalité */}
              <div className="mt-6 rounded border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p className="font-medium text-slate-700">
                  {isFr ? 'Règlement accepté :' : 'Accepted payment:'} MTN MoMo · Orange Money · Wave · Espèces
                </p>
                <p className="mt-2 text-[10px] text-slate-400 italic">
                  {isFr
                    ? 'Document généré en version gratuite via MyCashBill. Pour supprimer le filigrane et ajouter votre logo officiel, passez à l’offre Pro (2 000 FCFA/mois).'
                    : 'Generated with free version via MyCashBill. Upgrade to Pro (2,000 FCFA/month) to remove watermark and add your official logo.'}
                </p>
              </div>
            </div>

            {/* L'Effet IKEA et le micro-engagement (La conversion) */}
            <div className="rounded-xl border-2 border-sage-500 bg-white p-6 shadow-xl text-center space-y-3">
              <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
                🎉 {isFr ? 'Votre facture est prête !' : 'Your invoice is ready!'}
              </span>
              <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                {isFr
                  ? '« Votre facture est prête. Créez votre compte pour la conserver. »'
                  : '“Your invoice is ready. Create your account to keep it.”'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                {isFr
                  ? 'Vous avez investi 30 secondes pour créer ce document. Enregistrez votre compte gratuit dès maintenant pour le sauvegarder, l’exporter en PDF ou le partager directement avec votre client sur WhatsApp.'
                  : 'You invested 30 seconds to create this document. Save your free account now to store it, download clean PDF or share it with your client via WhatsApp.'}
              </p>
              <div className="pt-2">
                <Button size="lg" fullWidth className="max-w-md mx-auto" onClick={handleUnlock}>
                  {isFr
                    ? '💾 Conserver ma facture (Gratuit en 30 sec)'
                    : '💾 Save my invoice (Free in 30 sec)'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFr
                  ? '✓ 10 factures/mois offertes · ✓ Sans engagement · ✓ Sans carte bancaire'
                  : '✓ 10 invoices/month free · ✓ No commitment · ✓ No card required'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
