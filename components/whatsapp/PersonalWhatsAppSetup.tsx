'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, QrCode, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTip } from '@/components/ui/InfoTip';
import { useOnlineStatus } from '@/lib/device/network';

type Status = { status: 'NOT_CONFIGURED' | 'NOT_CREATED' | 'PENDING' | 'CONNECTED'; number: string | null; hasAddOn: boolean };

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

export function PersonalWhatsAppSetup({ locale }: { locale: 'fr' | 'en' }) {
  const fr = locale === 'fr';
  const online = useOnlineStatus();

  const [info, setInfo] = useState<Status | null>(null);
  const [phone, setPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  const refresh = async () => {
    try {
      const res = await fetch('/api/whatsapp/personal', { headers: { 'X-Requested-With': 'fetch' } });
      if (res.ok) {
        const data = (await res.json()) as Status;
        setInfo(data);
        if (!phone && data.number) setPhone(data.number);
        return data;
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suivi de la connexion pendant que le QR est affiché
  useEffect(() => {
    if (!qr) return;
    polls.current = 0;
    const id = setInterval(async () => {
      polls.current += 1;
      const data = await refresh();
      if (data?.status === 'CONNECTED' || polls.current >= MAX_POLLS) {
        clearInterval(id);
        if (data?.status === 'CONNECTED') setQr(null);
      }
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr]);

  const generate = async () => {
    setError(null);
    if (!online) {
      setError(fr ? 'Connexion requise pour connecter votre numéro.' : 'Connection required.');
      return;
    }
    if (!confirmed) {
      setError(fr ? 'Confirmez que ce numéro vous appartient.' : 'Confirm that this number is yours.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/whatsapp/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? (fr ? 'Impossible de générer le code.' : 'Could not generate the code.'));
        return;
      }
      if (!data.qrBase64) {
        setError(fr ? 'Le code de connexion n’a pas été reçu. Réessayez dans un instant.' : 'No connection code received. Try again shortly.');
        return;
      }
      setQr(data.qrBase64.startsWith('data:') ? data.qrBase64 : `data:image/png;base64,${data.qrBase64}`);
      await refresh();
    } catch {
      setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const connected = info?.status === 'CONNECTED';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <Smartphone className="h-5 w-5 text-emerald-600" />
          {fr ? 'Mon numéro WhatsApp' : 'My WhatsApp number'}
        </h1>
        <p className="text-sm text-slate-500">
          {fr
            ? 'Vos documents partiront de votre propre numéro, et non de celui de MyCashBill.'
            : 'Your documents will be sent from your own number, not MyCashBill’s.'}
        </p>
      </div>

      {info && !info.hasAddOn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{fr ? 'Extension non active' : 'Add-on not active'}</p>
          <p className="mt-1 text-xs">
            {fr
              ? 'Activez « Mon numéro WhatsApp » pour connecter votre numéro. Sans extension active, les envois partent de MyCashBill.'
              : 'Activate « My WhatsApp number » to connect your number. Without it, sending goes through MyCashBill.'}
          </p>
          <Link href={`/${locale}/upgrade` as Route} className="mt-2 inline-block font-bold underline">
            {fr ? 'Voir les extensions' : 'View add-ons'} →
          </Link>
        </div>
      )}

      {info?.status === 'NOT_CONFIGURED' && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">
          {fr
            ? 'Le service de connexion WhatsApp n’est pas encore configuré. Votre numéro est enregistré et la connexion sera possible dès la mise en service.'
            : 'The WhatsApp connection service is not configured yet. Your number is saved and connection will be possible once it is live.'}
        </div>
      )}

      {connected && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">
              {fr ? 'Votre numéro est connecté' : 'Your number is connected'}
            </p>
            <p className="text-emerald-800">{info?.number}</p>
            <p className="mt-1 text-xs text-emerald-800">
              {fr
                ? 'Les envois WhatsApp partent désormais de ce numéro.'
                : 'WhatsApp sends now go from this number.'}
            </p>
          </div>
        </div>
      )}

      {!connected && info?.hasAddOn && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <Input
            id="personal-phone"
            type="tel"
            inputMode="tel"
            label={fr ? 'Votre numéro WhatsApp' : 'Your WhatsApp number'}
            placeholder="6 99 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12"
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              {fr
                ? 'Ce numéro est le mien et je l’utilise pour mon activité.'
                : 'This number is mine and I use it for my business.'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <InfoTip id="tip-personal-wa" label={fr ? 'Comment ça marche' : 'How it works'} title={fr ? 'Connexion' : 'Connection'}>
              <p>
                {fr
                  ? 'Un code QR s’affiche. Scannez-le depuis le WhatsApp de ce numéro pour lier votre compte.'
                  : 'A QR code appears. Scan it from WhatsApp on this number to link your account.'}
              </p>
              <p>
                {fr
                  ? 'MyCashBill ne voit jamais vos messages personnels : seuls les documents que vous envoyez passent par ce lien.'
                  : 'MyCashBill never sees your personal messages: only the documents you send go through this link.'}
              </p>
            </InfoTip>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <Button type="button" fullWidth size="lg" className="min-h-12" onClick={generate} disabled={busy || !online} isLoading={busy}>
            <QrCode className="mr-2 h-4 w-4" />
            {fr ? 'Générer le code de connexion' : 'Generate connection code'}
          </Button>

          {qr && (
            <div className="space-y-3 border-t border-slate-100 pt-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={fr ? 'Code QR WhatsApp' : 'WhatsApp QR code'} className="mx-auto h-56 w-56 rounded-xl border border-slate-200 bg-white p-2" />
              <ol className="mx-auto max-w-xs space-y-1 text-left text-xs text-slate-600">
                <li>1. {fr ? 'Ouvrez WhatsApp sur le téléphone de ce numéro.' : 'Open WhatsApp on this number’s phone.'}</li>
                <li>2. {fr ? 'Menu › Appareils connectés › Connecter un appareil.' : 'Menu › Linked devices › Link a device.'}</li>
                <li>3. {fr ? 'Scannez le code affiché ici.' : 'Scan the code shown here.'}</li>
              </ol>
              <p className="text-xs text-slate-500">{fr ? 'En attente de la connexion…' : 'Waiting for connection…'}</p>
            </div>
          )}
        </div>
      )}

      <Link href={`/${locale}/upgrade` as Route} className="block text-center text-xs text-slate-500 hover:text-slate-800">
        ← {fr ? 'Retour aux extensions' : 'Back to add-ons'}
      </Link>
    </div>
  );
}
