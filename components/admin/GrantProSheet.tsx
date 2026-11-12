'use client';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from './ReauthSheet';

export function GrantProSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [phone, setPhone] = useState('');
  const [phonesText, setPhonesText] = useState('');
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const lookupUser = async () => {
    if (!phone) return;
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (json.users?.[0]) {
        setUserId(json.users[0].id);
        toast.show(`Utilisateur trouvé : ${json.users[0].name ?? json.users[0].phone}`, 'success');
      } else {
        toast.show('Aucun utilisateur trouvé', 'error');
      }
    } catch {
      toast.show('Erreur recherche', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.show('Motif obligatoire', 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'single') {
        if (!userId) {
          toast.show("Recherchez d'abord l'utilisateur", 'error');
          return;
        }
        const result = (await run('/api/admin/subscriptions/grant', {
          method: 'POST',
          body: JSON.stringify({ userId, days, reason, generateInvoice, sendEmail }),
        })) as { proUntil: string };
        toast.show(`Pro accordé jusqu'au ${new Date(result.proUntil).toLocaleDateString('fr-FR')}`, 'success');
      } else {
        const phones = phonesText.split(/\s+/).map((p) => p.trim()).filter(Boolean);
        if (phones.length === 0) {
          toast.show('Aucun numéro fourni', 'error');
          return;
        }
        const result = (await run('/api/admin/subscriptions/grant-bulk', {
          method: 'POST',
          body: JSON.stringify({ phones, days, reason, generateInvoices: generateInvoice }),
        })) as { success: number; failed: number };
        toast.show(`${result.success} succès, ${result.failed} échec(s)`, 'success');
      }
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Offrir un abonnement Pro</h2>

          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`min-h-11 px-3 py-1 rounded sm:min-h-0 ${mode === 'single' ? 'bg-sage-500 text-white' : ''}`}
            >
              Un utilisateur
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`min-h-11 px-3 py-1 rounded sm:min-h-0 ${mode === 'bulk' ? 'bg-sage-500 text-white' : ''}`}
            >
              Plusieurs
            </button>
          </div>

          {mode === 'single' ? (
            <>
              <div className="flex gap-2">
                <Input placeholder="+237XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button onClick={lookupUser} variant="secondary">
                  Chercher
                </Button>
              </div>
              {userId && <p className="text-xs text-success">✓ Utilisateur sélectionné</p>}
            </>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium">Numéros (un par ligne)</label>
              <textarea
                value={phonesText}
                onChange={(e) => setPhonesText(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono"
                placeholder="+237699111111&#10;+237699222222"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              label="Jours"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              inputMode="numeric"
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Raccourci</label>
              <div className="flex gap-1">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`min-h-11 rounded px-2 py-1 text-xs sm:min-h-0 ${days === d ? 'bg-sage-500 text-white' : 'bg-slate-100'}`}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Motif *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm"
              placeholder="Geste commercial, promotion, test partenaire..."
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
              />
              Générer une facture d&apos;abonnement
            </label>
            {mode === 'single' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                Envoyer la facture par email (si Resend activé)
              </label>
            )}
          </div>

          <Button fullWidth size="lg" onClick={handleSubmit} isLoading={loading} disabled={!reason.trim()}>
            {mode === 'single'
              ? 'Offrir Pro'
              : `Offrir à ${phonesText.split(/\s+/).filter(Boolean).length} utilisateur(s)`}
          </Button>
        </div>
      </Sheet>

      <ReauthSheet open={reauthOpen} onOpenChange={setReauthOpen} onSuccess={handleReauthSuccess} />
    </>
  );
}
