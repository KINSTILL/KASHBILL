'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, Smartphone, Copy, Check, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTip } from '@/components/ui/InfoTip';
import { useOnlineStatus } from '@/lib/device/network';

type Status = { status: 'NOT_CONFIGURED' | 'NOT_CREATED' | 'PENDING' | 'CONNECTED'; number: string | null; hasAddOn: boolean };

const POLL_MS = 2500;
const MAX_POLLS = 60; // ~2.5 minutes

export function PersonalWhatsAppSetup({ locale }: { locale: 'fr' | 'en' }) {
  const fr = locale === 'fr';
  const online = useOnlineStatus();

  const [info, setInfo] = useState<Status | null>(null);
  const [phone, setPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrAlternate, setShowQrAlternate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
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

  // Suivi en temps réel de la connexion pendant que le code ou le QR est affiché
  useEffect(() => {
    if (!qr && !pairingCode) return;
    polls.current = 0;
    const id = setInterval(async () => {
      polls.current += 1;
      const data = await refresh();
      if (data?.status === 'CONNECTED' || polls.current >= MAX_POLLS) {
        clearInterval(id);
        if (data?.status === 'CONNECTED') {
          setQr(null);
          setPairingCode(null);
        }
      }
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, pairingCode]);

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
      if (data.status === 'CONNECTED') {
        setQr(null);
        setPairingCode(null);
        await refresh();
        return;
      }
      if (!data.qrBase64 && !data.pairingCode) {
        setError(fr ? 'Le code de connexion n’a pas été reçu. Réessayez dans un instant.' : 'No connection code received. Try again shortly.');
        return;
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
      if (data.qrBase64) {
        setQr(data.qrBase64.startsWith('data:') ? data.qrBase64 : `data:image/png;base64,${data.qrBase64}`);
      }
      await refresh();
    } catch {
      setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await fetch('/api/whatsapp/personal', { method: 'DELETE' });
      setQr(null);
      setPairingCode(null);
      await refresh();
    } catch {
      setError(fr ? 'Erreur lors de la déconnexion.' : 'Failed to disconnect.');
    } finally {
      setDisconnecting(false);
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
          <p className="font-semibold">{fr ? 'Fonctionnalité Pro' : 'Pro Feature'}</p>
          <p className="mt-1 text-xs">
            {fr
              ? 'La connexion de votre propre numéro WhatsApp est incluse directement avec l’abonnement Pro. Passez Pro pour débloquer cette option.'
              : 'Connecting your own WhatsApp number is directly included with the Pro subscription. Upgrade to Pro to unlock this feature.'}
          </p>
          <Link href={`/${locale}/upgrade` as Route} className="mt-2 inline-block font-bold text-emerald-800 underline">
            {fr ? 'Passer Pro' : 'Upgrade to Pro'} →
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
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-emerald-900">
                {fr ? 'Votre numéro est connecté' : 'Your number is connected'}
              </p>
              <p className="text-emerald-800 font-mono font-bold mt-0.5">{info?.number}</p>
              <p className="mt-1 text-xs text-emerald-800">
                {fr
                  ? 'Vos factures et devis partent désormais directement depuis votre propre compte WhatsApp.'
                  : 'Your invoices and quotes are now sent directly from your own WhatsApp account.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{disconnecting ? (fr ? 'Déconnexion…' : 'Disconnecting…') : (fr ? 'Déconnecter ce numéro ou en changer' : 'Disconnect or change number')}</span>
            </button>
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
                  ? 'Un code à 8 chiffres s’affiche. Entrez-le dans WhatsApp sur ce téléphone pour lier votre compte en 5 secondes.'
                  : 'An 8-character code appears. Enter it in WhatsApp on this phone to pair in 5 seconds.'}
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
            <Smartphone className="mr-2 h-4 w-4" />
            {fr ? 'Connecter mon WhatsApp' : 'Connect my WhatsApp'}
          </Button>

          {/* PRIORITÉ 1 (Sur téléphone) : Code d'association 8 caractères */}
          {pairingCode && (
            <div className="space-y-3.5 border-t border-slate-100 pt-4 text-center">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold text-emerald-900 mb-1">
                  {fr ? 'Votre code d’association WhatsApp :' : 'Your WhatsApp pairing code:'}
                </p>
                <div className="flex items-center justify-center gap-2 my-2">
                  <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs">
                    {pairingCode}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(pairingCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      } catch {}
                    }}
                    className="p-2 rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 transition active:scale-95"
                    title={fr ? 'Copier le code' : 'Copy code'}
                  >
                    {copiedCode ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {copiedCode
                    ? (fr ? '✓ Code copié dans le presse-papiers !' : '✓ Code copied to clipboard!')
                    : (fr ? 'Touchez pour copier le code' : 'Tap to copy code')}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                <p className="text-xs font-bold text-slate-800 mb-1.5">
                  📱 {fr ? 'Comment lier depuis ce même téléphone :' : 'How to link on this same phone:'}
                </p>
                <ol className="space-y-1 text-xs text-slate-600">
                  <li>1. {fr ? 'Ouvrez WhatsApp sur ce téléphone.' : 'Open WhatsApp on this phone.'}</li>
                  <li>2. {fr ? 'Allez dans Réglages / Menu › Appareils connectés.' : 'Go to Settings / Menu › Linked devices.'}</li>
                  <li>3. {fr ? 'Touchez « Connecter un appareil » puis « Lier avec un numéro de téléphone ».' : 'Tap « Link a device » then « Link with phone number instead ».'}</li>
                  <li>4. {fr ? 'Collez ce code à 8 chiffres : la liaison est immédiate !' : 'Paste this 8-character code: pairing is instant!'}</li>
                </ol>
              </div>

              {/* Bouton pour réinitialiser / nouveau code si expiré */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={generate}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline"
                >
                  <RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
                  <span>{fr ? 'Code expiré ? En générer un nouveau' : 'Expired? Generate new code'}</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setPairingCode(null);
                    setQr(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  {fr ? 'Annuler' : 'Cancel'}
                </button>
              </div>

              {/* Option QR Code en repli pour ceux sur ordinateur */}
              {qr && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQrAlternate((v) => !v)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                  >
                    {showQrAlternate
                      ? (fr ? 'Masquer le code QR' : 'Hide QR code')
                      : (fr ? 'Vous êtes sur PC ? Afficher le code QR à scanner' : 'On PC? Show QR code to scan')}
                  </button>

                  {showQrAlternate && (
                    <div className="mt-3 space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qr} alt={fr ? 'Code QR WhatsApp' : 'WhatsApp QR code'} className="mx-auto h-52 w-52 rounded-xl border border-slate-200 bg-white p-2" />
                      <p className="text-[11px] text-slate-500">{fr ? 'Scannez avec l’appareil photo WhatsApp' : 'Scan with WhatsApp camera'}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs font-medium text-emerald-700 animate-pulse pt-1">
                ⏳ {fr ? 'En attente de la validation dans WhatsApp…' : 'Waiting for WhatsApp confirmation…'}
              </p>
            </div>
          )}

          {/* CAS OU LE SERVEUR N'A RENVOYÉ QUE LE QR CODE */}
          {!pairingCode && qr && (
            <div className="space-y-3 border-t border-slate-100 pt-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={fr ? 'Code QR WhatsApp' : 'WhatsApp QR code'} className="mx-auto h-56 w-56 rounded-xl border border-slate-200 bg-white p-2" />
              <ol className="mx-auto max-w-xs space-y-1 text-left text-xs text-slate-600">
                <li>1. {fr ? 'Ouvrez WhatsApp sur le téléphone de ce numéro.' : 'Open WhatsApp on this number’s phone.'}</li>
                <li>2. {fr ? 'Menu › Appareils connectés › Connecter un appareil.' : 'Menu › Linked devices › Link a device.'}</li>
                <li>3. {fr ? 'Scannez le code affiché ici.' : 'Scan the code shown here.'}</li>
              </ol>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={generate}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline"
                >
                  <RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
                  <span>{fr ? 'Générer un nouveau code' : 'Generate new code'}</span>
                </button>
              </div>
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
