'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function DemoSection({
  personalization,
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

  const currencyLabel = personalization.country?.currencySymbol || 'FCFA';

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
      // Échec non bloquant pour le rendu du mockup
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
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
            {isFr ? 'Essayez maintenant, sans inscription.' : 'Try now, no signup.'}
          </h2>
          <p className="mt-2 text-slate-600">
            {isFr
              ? 'Remplissez 3 champs, voyez votre facture, débloquez-la en 30 sec.'
              : 'Fill 3 fields, see your invoice, unlock in 30 sec.'}
          </p>
        </div>

        {!generated ? (
          <div className="surface mx-auto mt-8 max-w-md space-y-3">
            <input
              placeholder={isFr ? 'Votre nom' : 'Your name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              maxLength={100}
            />
            <input
              placeholder={isFr ? 'Prestation (ex : Confection robe)' : 'Service (e.g., Dressmaking)'}
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              maxLength={200}
            />
            <input
              placeholder={isFr ? `Montant (${currencyLabel})` : `Amount (${currencyLabel})`}
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              min="1"
            />
            <Button
              fullWidth
              onClick={handleGenerate}
              isLoading={loading}
              disabled={!name.trim() || !service.trim() || !amount}
            >
              {isFr ? '👁️ Aperçu de ma facture' : '👁️ Preview my invoice'}
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-md">
            {/* Mockup HTML A4 — pur HTML/CSS, pas de react-pdf */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
              <div className="border-b border-slate-200 pb-4">
                <p className="font-display text-xl font-bold text-ink">
                  {isFr ? 'FACTURE' : 'INVOICE'}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  N° DEMO-{Date.now().toString().slice(-6)}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{name}</p>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-GB')}
                </p>
              </div>

              {/* Ligne 1 — visible */}
              <div className="mt-4 flex justify-between border-b border-slate-100 py-2 text-sm">
                <span className="text-slate-700">{service}</span>
                <span className="font-medium text-ink">
                  {amountFormatted} {currencyLabel}
                </span>
              </div>

              {/* Lignes masquées avec flou */}
              <div className="relative mt-2">
                <div className="pointer-events-none select-none space-y-2 blur-sm" aria-hidden>
                  <div className="flex justify-between border-b border-slate-100 py-2 text-sm">
                    <span className="text-slate-700">
                      {isFr ? 'Frais de service' : 'Service fee'}
                    </span>
                    <span className="font-medium text-ink">5 000 {currencyLabel}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-slate-700">TVA (19,25%)</span>
                    <span className="font-medium text-ink">4 812 {currencyLabel}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t-2 border-slate-900 pt-3">
                    <span className="text-base font-bold text-ink">TOTAL</span>
                    <span className="font-display text-lg font-extrabold text-terracotta">
                      {amountFormatted} {currencyLabel}
                    </span>
                  </div>
                </div>

                {/* Overlay CTA */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent via-white/80 to-white backdrop-blur-sm p-4">
                  <p className="text-center text-sm font-semibold text-ink">
                    {isFr ? 'Débloquez votre facture complète' : 'Unlock your full invoice'}
                  </p>
                  <Button size="lg" onClick={handleUnlock}>
                    {isFr
                      ? '🔓 Débloquer et envoyer sur WhatsApp (Gratuit 30 sec)'
                      : '🔓 Unlock and send on WhatsApp (Free 30s)'}
                  </Button>
                  <p className="text-[10px] text-slate-500 text-center">
                    {isFr
                      ? 'Filigrane retiré · Logo ajouté · Historique conservé'
                      : 'Watermark removed · Logo added · History kept'}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-400">
              {isFr
                ? 'Aperçu — pas de téléchargement possible sans compte'
                : 'Preview — no download without account'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
