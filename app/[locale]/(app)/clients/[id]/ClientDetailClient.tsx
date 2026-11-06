'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface ClientData {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  taxId?: string | null;
}

export function ClientDetailClient({
  client,
  locale,
}: {
  client: ClientData;
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();

  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone || '');
  const [address, setAddress] = useState(client.address || '');
  const [taxId, setTaxId] = useState(client.taxId || '');
  const [note, setNote] = useState(client.note || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          taxId: taxId.trim() || null,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || t('common.error'), error: true });
        return;
      }

      setMessage({ text: 'Client mis à jour avec succès' });
      router.refresh();
    } catch {
      setMessage({ text: t('common.error'), error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      t('clients.deleteConfirm') || 'Supprimer ce client ? Les documents liés ne seront pas supprimés.'
    );
    if (!confirm) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setMessage({ text: 'Erreur lors de la suppression', error: true });
        return;
      }
      router.push(`/${locale}/clients` as Route);
      router.refresh();
    } catch {
      setMessage({ text: t('common.error'), error: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6">
      {message && (
        <div
          role="alert"
          className={`mb-4 rounded-lg p-3 text-sm font-medium ${
            message.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nom complet ou Entreprise *
          </label>
          <Input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">
            Adresse physique / Ville
          </label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-slate-700">
            {t('clients.taxId')}
          </label>
          <Input
            id="taxId"
            type="text"
            placeholder={t('clients.taxIdPlaceholder')}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-slate-700">
            Notes
          </label>
          <Input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving || deleting || name.trim().length === 0}
            loading={saving}
            className="thumb-zone"
          >
            {t('common.save')}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={saving || deleting}
            loading={deleting}
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50 thumb-zone"
          >
            {t('common.delete')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

