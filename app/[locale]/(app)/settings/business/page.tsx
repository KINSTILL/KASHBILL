'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Building2,
  Palette,
  Stamp,
  FileText,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProBadge } from '@/components/ui/ProBadge';
import { ImagePicker } from '@/components/documents/ImagePicker';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro, isWithinLogoGracePeriod } from '@/lib/auth/plan';
import { DEFAULT_BRAND } from '@/lib/pdf/brand';

export default function BusinessSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const { user, refresh } = useCurrentUser();

  const pro = user ? isPro(user) : false;
  const inGrace = user ? isWithinLogoGracePeriod(user) : false;
  const canUseBranding = pro || inGrace;
  const canUseWhiteLabel = user?.whiteLabel === true;

  const [brandPrimary, setBrandPrimary] = useState<string>(DEFAULT_BRAND.primary);
  const [brandAccent, setBrandAccent] = useState<string>(DEFAULT_BRAND.accent);

  const [country, setCountry] = useState('CM');
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [taxId, setTaxId] = useState('');
  const [rccm, setRccm] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [cgvText, setCgvText] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      setCountry(user.country || 'CM');
      setBusinessName(user.businessName || '');
      setLegalName(user.legalName || '');
      setLegalForm(user.legalForm || '');
      setTaxId(user.taxId || '');
      setRccm(user.rccm || '');
      setLegalAddress(user.legalAddress || '');
      setHeaderText(user.headerText || '');
      setFooterText(user.footerText || '');
      setCgvText(user.cgvText || '');
      setLogoUrl(user.logoUrl || null);
      setSignatureUrl(user.signatureUrl || null);
      setStampUrl(user.stampUrl || null);
      setBrandPrimary(user.brandPrimaryColor || DEFAULT_BRAND.primary);
      setBrandAccent(user.brandAccentColor || DEFAULT_BRAND.accent);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      // Couleurs envoyées uniquement en white label (sinon le serveur refuse la modification).
      // Les valeurs par défaut sont enregistrées comme null => palette MyCashBill.
      const isDefaultBrand =
        brandPrimary === DEFAULT_BRAND.primary && brandAccent === DEFAULT_BRAND.accent;
      const brandFields = canUseWhiteLabel
        ? {
            brandPrimaryColor: isDefaultBrand ? null : brandPrimary,
            brandAccentColor: isDefaultBrand ? null : brandAccent,
          }
        : {};

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          businessName: businessName.trim() || null,
          legalName: legalName.trim() || null,
          legalForm: legalForm.trim() || null,
          taxId: taxId.trim() || null,
          rccm: rccm.trim() || null,
          legalAddress: legalAddress.trim() || null,
          headerText: headerText.trim() || null,
          footerText: footerText.trim() || null,
          cgvText: cgvText.trim() || null,
          logoUrl,
          signatureUrl,
          stampUrl,
          ...brandFields,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || commonT('error'), error: true });
        return;
      }

      await refresh();
      setMessage({ text: t('saved') });
    } catch {
      setMessage({ text: commonT('error'), error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">
              {t('business')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {t('businessHelp')}
            </p>
          </div>
        </div>
        <Link
          href={'/settings' as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{commonT('back')}</span>
        </Link>
      </div>

      {message && (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${
            message.error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {!message.error && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Visual Identity / Branding */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Stamp className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Identité visuelle &amp; Signatures
              </h2>
            </div>
            {!canUseBranding && <ProBadge label={t('proRequired')} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <ImagePicker
                kind="logo"
                label={t('logo')}
                value={logoUrl}
                onChange={setLogoUrl}
                disabled={!canUseBranding}
              />
            </div>
            <div>
              <ImagePicker
                kind="signature"
                label={t('signature')}
                value={signatureUrl}
                onChange={setSignatureUrl}
                disabled={!canUseBranding}
              />
            </div>
            <div>
              <ImagePicker
                kind="stamp"
                label={t('stamp')}
                value={stampUrl}
                onChange={setStampUrl}
                disabled={!canUseBranding}
              />
            </div>
          </div>
        </Card>

        {/* White label : couleurs de la facture */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <Palette className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Couleurs de vos documents</h2>
            </div>
            {!canUseWhiteLabel && <ProBadge label="White label" />}
          </div>

          {canUseWhiteLabel ? (
            <p className="text-xs text-slate-500">
              Ces couleurs remplacent la palette MyCashBill sur vos factures, devis et reçus.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Personnalisez vos documents aux couleurs de votre entreprise avec l&apos;option White label.{' '}
              <Link href={'/upgrade' as Route} className="font-medium text-sage-700 underline">
                Découvrir l&apos;option
              </Link>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brandPrimary" className="block text-sm font-medium text-slate-700">
                Couleur principale
              </label>
              <p className="text-[11px] text-slate-500">Titres, nom de l&apos;entreprise, filets</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="brandPrimary"
                  type="color"
                  value={brandPrimary}
                  disabled={!canUseWhiteLabel}
                  onChange={(e) => setBrandPrimary(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="font-mono text-xs text-slate-600">{brandPrimary.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label htmlFor="brandAccent" className="block text-sm font-medium text-slate-700">
                Couleur d&apos;accent
              </label>
              <p className="text-[11px] text-slate-500">Montant total mis en avant</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="brandAccent"
                  type="color"
                  value={brandAccent}
                  disabled={!canUseWhiteLabel}
                  onChange={(e) => setBrandAccent(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="font-mono text-xs text-slate-600">{brandAccent.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {canUseWhiteLabel && (
            <button
              type="button"
              onClick={() => {
                setBrandPrimary(DEFAULT_BRAND.primary);
                setBrandAccent(DEFAULT_BRAND.accent);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Revenir à la palette MyCashBill
            </button>
          )}
        </Card>

        {/* Legal mentions */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Building2 className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Mentions légales panafricaines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                {t('country')}
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm shadow-sm focus:border-sage-500 focus:ring-sage-500"
              >
                <option value="CM">Cameroun (XAF - FCFA)</option>
                <option value="CI">Côte d&apos;Ivoire (XOF - FCFA)</option>
                <option value="SN">Sénégal (XOF - FCFA)</option>
                <option value="GA">Gabon (XAF - FCFA)</option>
                <option value="CG">Congo (XAF - FCFA)</option>
              </select>
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700">
                Nom commercial
              </label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Douala Prestige"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="legalName" className="block text-sm font-medium text-slate-700">
                  {t('legalName')} (Raison sociale)
                </label>
                {!pro && <ProBadge size="sm" />}
              </div>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: SARL KASHBILL"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="legalForm" className="block text-sm font-medium text-slate-700">
                  {t('legalForm')}
                </label>
              </div>
              <Input
                id="legalForm"
                value={legalForm}
                onChange={(e) => setLegalForm(e.target.value)}
                placeholder={t('legalFormPlaceholder')}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="taxId" className="block text-sm font-medium text-slate-700">
                  {t('taxId')} (N° Contribuable / NIF)
                </label>
                {!pro && <ProBadge size="sm" />}
              </div>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ex: M052300012345Z"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="rccm" className="block text-sm font-medium text-slate-700">
                  {t('rccm')}
                </label>
                {!pro && <ProBadge size="sm" />}
              </div>
              <Input
                id="rccm"
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                placeholder="Ex: RC/DLA/2024/B/123"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="legalAddress" className="block text-sm font-medium text-slate-700">
                {t('legalAddress')}
              </label>
              <Input
                id="legalAddress"
                value={legalAddress}
                onChange={(e) => setLegalAddress(e.target.value)}
                placeholder="Ex: Akwa, BP 1234 Douala"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Custom headers / footers / CGV */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              En-tête, Pied de page &amp; CGV
            </h2>
          </div>

          <div>
            <label htmlFor="headerText" className="block text-sm font-medium text-slate-700">
              {t('headerText')}
            </label>
            <Input
              id="headerText"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Ex: Vente de matériel informatique garanti"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="footerText" className="block text-sm font-medium text-slate-700">
              {t('footerText')}
            </label>
            <Input
              id="footerText"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Ex: Merci pour votre confiance ! Marchandise ni reprise ni échangée"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="cgvText" className="block text-sm font-medium text-slate-700">
              {t('cgvText')}
            </label>
            <textarea
              id="cgvText"
              rows={3}
              value={cgvText}
              onChange={(e) => setCgvText(e.target.value)}
              placeholder="Conditions Générales de Vente qui s'afficheront en annexe..."
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[16px] sm:text-xs shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </Card>

        {/* Live Preview Box */}
        <Card className="p-4 bg-slate-50/80 border border-slate-200/90">
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>Aperçu en direct sur document :</span>
            </span>
            <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Simulation d&apos;en-tête
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                {businessName && (
                  <p className="font-bold text-base text-slate-900">{businessName}</p>
                )}
                {legalName && (
                  <p className="text-xs text-slate-700 font-semibold">{legalName}</p>
                )}
                {taxId && <p className="text-[11px] text-slate-500">NIU/NIF: {taxId}</p>}
                {rccm && <p className="text-[11px] text-slate-500">RCCM: {rccm}</p>}
                {legalAddress && (
                  <p className="text-[11px] text-slate-500">{legalAddress}</p>
                )}
              </div>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-10 max-w-28 object-contain" />
              ) : (
                <div className="text-[10px] text-slate-300 italic">Pas de logo</div>
              )}
            </div>

            {headerText && (
              <p className="mt-2 text-xs italic text-slate-600 border-t border-slate-100 pt-1">
                {headerText}
              </p>
            )}
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          loading={saving}
          className="w-full thumb-zone"
        >
          {t('save')}
        </Button>
      </form>
    </div>
  );
}

