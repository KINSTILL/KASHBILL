'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import countries from 'i18n-iso-countries';
import frLocale from 'i18n-iso-countries/langs/fr.json';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { useCurrentUser } from '@/components/providers/SessionProvider';

countries.registerLocale(frLocale);
countries.registerLocale(enLocale);

export default function NewClientPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (useLocale() || params?.locale || 'fr') as 'fr' | 'en';
  const { user } = useCurrentUser();
  const userCountry = user?.country ?? 'CM';
  const allCountries = Object.entries(countries.getNames(locale))
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [note, setNote] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          taxId: taxId.trim() || null,
          note: note.trim() || null,
          country: country || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errCode = data.code || data.error?.code;
        const errMsg = data.message || data.error?.message;
        if (errCode === 'PLAN_LIMIT_REACHED') {
          setError(errMsg || "Limite gratuite atteinte (3 clients max). Passez Pro pour en ajouter davantage.");
          return;
        }
        setError(errMsg || t('common.error'));
        return;
      }

      router.push(`/${locale}/clients` as Route);
      router.refresh();
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Nouveau client
        </h1>
        <Link
          href={`/${locale}/clients` as Route}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {t('common.cancel')}
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nom complet ou Entreprise *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ex : Entreprise Alpha ou Jean Dupont"
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
              name="phone"
              type="tel"
              placeholder="+237 699 00 00 00"
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
              placeholder="Ex: Douala, Akwa"
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
              placeholder="Informations supplémentaires (NFC, préférences...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
              {t('clients.country')}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="thumb-zone w-full rounded-btn border border-slate-200 bg-white px-3.5 text-[15px]"
            >
              <option value="">{t('clients.countryDefault', { country: userCountry })}</option>
              {allCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || name.trim().length === 0}
              loading={loading}
              className="flex-1 thumb-zone"
            >
              {t('common.save')}
            </Button>
            <Link href={`/${locale}/clients` as Route} className="flex-1">
              <Button type="button" variant="outline" className="w-full thumb-zone">
                {t('common.cancel')}
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

