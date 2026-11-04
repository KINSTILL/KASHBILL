'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/auth/PinInput';
import { setReauthToken } from '@/lib/admin/client';
import { haptic } from '@/lib/device/haptics';

export function ReauthSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reauth/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        haptic('heavy');
        setError(res.status === 401 ? 'PIN incorrect' : 'Erreur de ré-authentification');
        return;
      }
      const { reauthToken, expiresInSeconds } = await res.json();
      setReauthToken(reauthToken, expiresInSeconds);
      haptic('medium');
      setPin('');
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Ré-authentification requise</h2>
        <p className="text-sm text-slate-600">
          Pour cette action critique, saisissez votre PIN.
        </p>
        <PinInput value={pin} onChange={setPin} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={pin.length !== 6}
        >
          Confirmer
        </Button>
      </div>
    </Sheet>
  );
}

