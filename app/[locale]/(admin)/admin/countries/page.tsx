'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type Country = {
  countryCode: string;
  countryNameFr: string;
  countryNameEn: string;
  currency: string;
  taxIdLabel: string;
  rccmLabel: string;
  vatRate: number | null;
  isActive: boolean;
  legalMentionsTemplate: string;
};

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Sheet states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [countryCode, setCountryCode] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [taxIdLabel, setTaxIdLabel] = useState('NUI');
  const [rccmLabel, setRccmLabel] = useState('RCCM');
  const [vatRate, setVatRate] = useState<number | string>(19.25);
  const [legalTemplate, setLegalTemplate] = useState('Facture établie sous le régime fiscal local');

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const loadCountries = () => {
    setLoading(true);
    adminFetch('/api/admin/countries').then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setCountries((res.data as { countries: Country[] }).countries);
      }
    });
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const handleToggleActive = async (c: Country) => {
    setFeedback(null);
    try {
      await run(`/api/admin/countries/${c.countryCode}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      setFeedback({
        type: 'success',
        msg: `Pays ${c.countryNameFr} ${!c.isActive ? 'activé' : 'désactivé'} (cache invalidé).`,
      });
      loadCountries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du changement de statut.';
      setFeedback({
        type: 'error',
        msg,
      });
    }
  };

  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await run('/api/admin/countries', {
        method: 'POST',
        body: JSON.stringify({
          countryCode: countryCode.trim().toUpperCase(),
          countryNameFr: nameFr.trim(),
          countryNameEn: nameEn.trim() || nameFr.trim(),
          currency: currency.trim().toUpperCase(),
          taxIdLabel: taxIdLabel.trim(),
          rccmLabel: rccmLabel.trim(),
          vatRate: vatRate === '' ? null : Number(vatRate),
          legalMentionsTemplate: legalTemplate.trim(),
          isActive: true,
        }),
      });
      setFeedback({ type: 'success', msg: `Pays ${countryCode.toUpperCase()} ajouté avec succès.` });
      setIsAddOpen(false);
      setCountryCode('');
      setNameFr('');
      setNameEn('');
      loadCountries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du pays.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pays & Fiscalité ({countries.length})</h1>
          <p className="text-sm text-slate-600">
            Gestion des juridictions supportées, devises et taux de TVA.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          + Nouveau pays
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3">Devise</th>
              <th className="px-4 py-3">Labels fiscaux</th>
              <th className="px-4 py-3">TVA</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : countries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Aucun pays configuré.
                </td>
              </tr>
            ) : (
              countries.map((c) => (
                <tr key={c.countryCode} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {c.countryCode}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {c.countryNameFr}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {c.currency}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.taxIdLabel} / {c.rccmLabel}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {c.vatRate !== null ? `${c.vatRate}%` : 'Sans TVA'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        c.isActive
                          ? 'bg-green-100 text-success'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(c)}
                    >
                      {c.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Country Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <form onSubmit={handleCreateCountry} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Ajouter un nouveau pays
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Code ISO (2 car.)</label>
              <Input
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="CM"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Devise (3 car.)</label>
              <Input
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="XAF"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Nom en Français</label>
            <Input
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
              placeholder="Cameroun"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Nom en Anglais</label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Cameroon"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-700">Label Tax ID</label>
              <Input
                value={taxIdLabel}
                onChange={(e) => setTaxIdLabel(e.target.value)}
                placeholder="NUI"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Label RCCM</label>
              <Input
                value={rccmLabel}
                onChange={(e) => setRccmLabel(e.target.value)}
                placeholder="RCCM"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Taux TVA (%)</label>
              <Input
                type="number"
                step="0.01"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                placeholder="19.25"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Mentions légales par défaut</label>
            <Input
              value={legalTemplate}
              onChange={(e) => setLegalTemplate(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={submitting}
            disabled={!countryCode.trim() || !nameFr.trim()}
          >
            Créer la juridiction fiscale
          </Button>
        </form>
      </Sheet>

      {/* PIN Re-authentication Sheet */}
      <ReauthSheet
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onSuccess={handleReauthSuccess}
      />
    </div>
  );
}
