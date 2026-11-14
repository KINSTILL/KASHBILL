'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Building2,
  Palette,
  Stamp,
  FileText,
  Eye,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Receipt,
  Globe2,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProBadge } from '@/components/ui/ProBadge';
import { ImagePicker } from '@/components/documents/ImagePicker';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro, isWithinLogoGracePeriod } from '@/lib/auth/plan';
import { DEFAULT_BRAND } from '@/lib/pdf/brand';
import { InfoTip } from '@/components/ui/InfoTip';
import { VisualPresetsSelector } from '@/components/settings/VisualPresetsSelector';
import { findPresetByColors } from '@/lib/branding/presets';

type TabKey = 'branding' | 'legal' | 'invoicing';

const COMMON_LEGAL_FORMS = ['SARL', 'SAS', 'ETS', 'SA', 'Auto-entrepreneur'];

export default function BusinessSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const { user, refresh } = useCurrentUser();

  const pro = user ? isPro(user) : false;
  const locale = useLocale();
  const fr = locale !== 'en';

  // Logo, signature et cachet : réservés au Pro
  const canUseBranding = pro;
  // Logo : gratuit pendant 7 jours après l'inscription, puis Pro
  const canUseLogoField = pro || (user ? isWithinLogoGracePeriod(user) : false);
  const canUseWhiteLabel = user?.whiteLabel === true;

  const [activeTab, setActiveTab] = useState<TabKey>('branding');

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
  const [decimalPlaces, setDecimalPlaces] = useState<0 | 1 | 2>(0);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [showStampOnTicket, setShowStampOnTicket] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Initialisation à partir des données utilisateur
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
      setShowStampOnTicket(user.showStampOnTicket ?? false);
      setBrandPrimary(user.brandPrimaryColor || DEFAULT_BRAND.primary);
      setBrandAccent(user.brandAccentColor || DEFAULT_BRAND.accent);
      setDecimalPlaces(user.decimalPlaces === 1 || user.decimalPlaces === 2 ? user.decimalPlaces : 0);
    }
  }, [user]);

  // Calcul dynamique de complétude du profil entreprise (sur 6 piliers clés)
  const profileCompletion = useMemo(() => {
    const checks = [
      { id: 'logo', filled: Boolean(logoUrl), label: fr ? 'Logo d’entreprise' : 'Company logo' },
      { id: 'name', filled: Boolean(businessName.trim() || legalName.trim()), label: fr ? 'Nom / Raison sociale' : 'Business / Legal name' },
      { id: 'form', filled: Boolean(legalForm.trim()), label: fr ? 'Forme juridique' : 'Legal form' },
      { id: 'taxId', filled: Boolean(taxId.trim()), label: fr ? 'NIF / NIU' : 'Tax ID' },
      { id: 'rccm', filled: Boolean(rccm.trim()), label: fr ? 'RCCM' : 'Trade register' },
      { id: 'address', filled: Boolean(legalAddress.trim()), label: fr ? 'Adresse du siège' : 'Legal address' },
    ];
    const filledCount = checks.filter((c) => c.filled).length;
    const percentage = Math.round((filledCount / checks.length) * 100);
    const hasOhadaMandatory = Boolean(taxId.trim()) && Boolean(rccm.trim());
    return { checks, filledCount, total: checks.length, percentage, hasOhadaMandatory };
  }, [logoUrl, businessName, legalName, legalForm, taxId, rccm, legalAddress, fr]);

  // Détection de modifications non enregistrées
  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      (user.country || 'CM') !== country ||
      (user.businessName || '') !== businessName ||
      (user.legalName || '') !== legalName ||
      (user.legalForm || '') !== legalForm ||
      (user.taxId || '') !== taxId ||
      (user.rccm || '') !== rccm ||
      (user.legalAddress || '') !== legalAddress ||
      (user.headerText || '') !== headerText ||
      (user.footerText || '') !== footerText ||
      (user.cgvText || '') !== cgvText ||
      (user.logoUrl || null) !== logoUrl ||
      (user.signatureUrl || null) !== signatureUrl ||
      (user.stampUrl || null) !== stampUrl ||
      Boolean(user.showStampOnTicket) !== showStampOnTicket ||
      (user.brandPrimaryColor || DEFAULT_BRAND.primary) !== brandPrimary ||
      (user.brandAccentColor || DEFAULT_BRAND.accent) !== brandAccent ||
      (user.decimalPlaces === 1 || user.decimalPlaces === 2 ? user.decimalPlaces : 0) !== decimalPlaces
    );
  }, [
    user,
    country,
    businessName,
    legalName,
    legalForm,
    taxId,
    rccm,
    legalAddress,
    headerText,
    footerText,
    cgvText,
    logoUrl,
    signatureUrl,
    stampUrl,
    showStampOnTicket,
    brandPrimary,
    brandAccent,
    decimalPlaces,
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
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
          showStampOnTicket,
          ...brandFields,
          decimalPlaces,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || commonT('error'), error: true });
        return;
      }

      await refresh();
      setMessage({
        text: fr
          ? 'Paramètres et identité de l’entreprise enregistrés avec succès !'
          : 'Company settings and branding saved successfully!',
      });
    } catch {
      setMessage({ text: commonT('error'), error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 sm:pb-8">
      {/* En-tête Principal de la page */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/10">
            <Building2 className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-emerald-600 shadow-xs border border-emerald-100">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 truncate">
              {fr ? 'Paramètres et Identité de mon Entreprise' : 'Company Settings and Branding'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">
              {fr
                ? 'Logo, coordonnées fiscales, cachet et en-tête officiel de vos factures'
                : 'Logo, legal & tax details, stamp, and official invoice header'}
            </p>
          </div>
        </div>

        <Link
          href={'/settings' as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{commonT('back')}</span>
        </Link>
      </div>

      {/* Message de succès / erreur */}
      {message && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-sm font-medium shadow-xs transition ${
            message.error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.error ? (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline shrink-0"
          >
            {commonT('close')}
          </button>
        </div>
      )}

      {/* Carte Statut & Complétude OHADA */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-sm overflow-hidden relative">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-100">
                {fr ? 'Complétude des paramètres de facturation' : 'Invoice Settings Completeness'}
              </span>
            </div>

            {profileCompletion.hasOhadaMandatory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {fr ? 'Conforme OHADA' : 'OHADA Compliant'}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{fr ? `${profileCompletion.filledCount} sur ${profileCompletion.total} éléments renseignés` : `${profileCompletion.filledCount} of ${profileCompletion.total} details completed`}</span>
              <span className="font-bold text-emerald-400">{profileCompletion.percentage}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-300/90 leading-relaxed">
            {fr
              ? 'Ces données sont apposées automatiquement sur chacun de vos devis, factures et reçus pour garantir leur pleine validité juridique et comptable.'
              : 'These details are automatically placed on all quotes, invoices, and receipts to guarantee full legal and accounting compliance.'}
          </p>
        </div>
      </Card>

      {/* Aperçu Dynamique de l'En-tête de Document (Live Document Sandbox) */}
      <Card className="p-4 sm:p-5 border-slate-200/90 bg-slate-50/70 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Eye className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {fr ? 'Aperçu en direct sur vos documents' : 'Live Document Header Preview'}
            </span>
          </div>
          <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-2xs">
            {fr ? 'Rendu client A4' : 'A4 Client view'}
          </span>
        </div>

        {/* Maquette En-tête A4 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs relative overflow-hidden">
          {/* Ligne d'accent personnalisée (White Label) */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 transition-colors"
            style={{ backgroundColor: canUseWhiteLabel ? brandPrimary : DEFAULT_BRAND.primary }}
          />

          <div className="flex items-start justify-between gap-4 mt-1">
            <div className="space-y-1 min-w-0 flex-1">
              {businessName || legalName ? (
                <div>
                  <h3
                    className="font-extrabold text-base sm:text-lg leading-tight transition-colors truncate"
                    style={{ color: canUseWhiteLabel ? brandPrimary : '#0F172A' }}
                  >
                    {businessName || legalName}
                  </h3>
                  {legalName && businessName && legalName !== businessName && (
                    <p className="text-xs font-semibold text-slate-700">{legalName}</p>
                  )}
                  {legalForm && (
                    <span className="inline-block mt-0.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {legalForm}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-sm font-bold text-slate-400 italic">
                  {fr ? 'Nom de votre entreprise' : 'Your business name'}
                </div>
              )}

              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p>
                  <span className="font-semibold text-slate-700">NIF / NIU :</span>{' '}
                  <span className="font-mono">{taxId || (fr ? 'Non renseigné' : 'Not set')}</span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">RCCM :</span>{' '}
                  <span className="font-mono">{rccm || (fr ? 'Non renseigné' : 'Not set')}</span>
                </p>
                <p className="text-slate-500">
                  {legalAddress || (fr ? 'Adresse légale du siège…' : 'Legal business address…')}
                </p>
              </div>
            </div>

            {/* Logo Sandbox */}
            <div className="shrink-0 text-right">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo entreprise"
                  className="h-12 max-w-28 sm:max-w-36 object-contain rounded border border-slate-100 p-0.5 bg-white shadow-2xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className="flex flex-col items-center justify-center h-12 w-24 sm:w-28 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition p-1"
                >
                  <span className="text-[10px] font-semibold">
                    {fr ? '+ Logo' : '+ Add logo'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Slogan / En-tête additionnel */}
          {headerText && (
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs italic text-slate-600 leading-snug">
              &laquo; {headerText} &raquo;
            </div>
          )}

          {/* Simulation du style visuel (Ligne d'accent + Encadré Net à payer) */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {fr ? 'Aperçu du Net à payer :' : 'Net due preview:'}
            </span>
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition-colors"
              style={{
                backgroundColor: canUseWhiteLabel ? brandPrimary : DEFAULT_BRAND.primary,
                borderBottom: `2px solid ${canUseWhiteLabel ? brandAccent : DEFAULT_BRAND.accent}`,
              }}
            >
              {fr ? 'NET À PAYER : 150 000 FCFA' : 'NET DUE: 150,000 FCFA'}
            </span>
          </div>
        </div>
      </Card>

      {/* Barre d'onglets segmentés ergonomiques */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'branding'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Stamp className="h-4 w-4 shrink-0" />
          <span className="truncate">{fr ? 'Image de marque' : 'Branding'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'legal'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{fr ? 'Fiscalité et Légal' : 'Legal and Tax'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoicing')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'invoicing'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{fr ? 'En-tête et CGV' : 'Header and Terms'}</span>
        </button>
      </div>

      {/* Formulaire Principal découpé en onglets */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ONGLET 1 : Image de marque (Logo, Signature, Cachet, White Label) */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Stamp className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {fr ? 'Logo, Signature et Cachet officiel' : 'Logo, Signature and Official Stamp'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {fr
                        ? 'Apparaissent au bas et en en-tête de vos documents imprimés et partagés'
                        : 'Displayed at the top and bottom of your printed and shared documents'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InfoTip
                    id="guide-branding"
                    label={fr ? 'Aide' : 'Help'}
                    title={fr ? 'Logo, signature et cachet' : 'Logo, signature and stamp'}
                  >
                    <p>
                      {fr
                        ? "Signature et cachet : réservés aux comptes Pro. Logo : gratuit pendant 7 jours après l'inscription, puis réservé au Pro."
                        : 'Signature and stamp: Pro only. Logo: free for 7 days after sign-up, then Pro only.'}
                    </p>
                    <p>
                      {fr
                        ? 'Vos images restent sauvegardées dans votre espace sécurisé.'
                        : 'Your images stay securely saved in your workspace.'}
                    </p>
                  </InfoTip>
                  {!canUseBranding && <ProBadge label={t('proRequired')} />}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <ImagePicker
                    kind="logo"
                    label={t('logo')}
                    guide={{
                      id: 'guide-logo',
                      title: fr ? 'Logo de votre entreprise' : 'Company logo',
                      body: fr ? (
                        <>
                          <p>Apparaît en haut de chacun de vos documents.</p>
                          <p>PNG ou JPEG, 200 Ko maximum.</p>
                          <p>Un PNG à fond transparent donne le meilleur rendu.</p>
                          <p>Gratuit pendant 7 jours après l’inscription, puis réservé au Pro.</p>
                        </>
                      ) : (
                        <>
                          <p>Shown at the top of each of your documents.</p>
                          <p>PNG or JPEG, 200 KB maximum.</p>
                          <p>A PNG with a transparent background gives the best result.</p>
                          <p>Free for 7 days after sign-up, then Pro only.</p>
                        </>
                      ),
                    }}
                    value={logoUrl}
                    onChange={setLogoUrl}
                    disabled={!canUseLogoField}
                  />
                </div>

                <div>
                  <ImagePicker
                    kind="signature"
                    label={t('signature')}
                    guide={{
                      id: 'guide-signature',
                      title: fr ? 'Votre signature' : 'Your signature',
                      body: fr ? (
                        <>
                          <p>Signez sur une feuille blanche, puis photographiez-la ou scannez-la.</p>
                          <p>PNG à fond transparent de préférence, 50 Ko maximum.</p>
                          <p>Elle apparaît au bas de vos documents, à côté du cachet.</p>
                          <p>Réservée au Pro.</p>
                        </>
                      ) : (
                        <>
                          <p>Sign on a white sheet, then photograph or scan it.</p>
                          <p>Transparent-background PNG preferred, 50 KB maximum.</p>
                          <p>It appears at the bottom of your documents, next to the stamp.</p>
                          <p>Pro only.</p>
                        </>
                      ),
                    }}
                    value={signatureUrl}
                    onChange={setSignatureUrl}
                    disabled={!canUseBranding}
                  />
                </div>

                <div>
                  <ImagePicker
                    kind="stamp"
                    label={t('stamp')}
                    guide={{
                      id: 'guide-stamp',
                      title: fr ? 'Votre cachet' : 'Your stamp',
                      body: fr ? (
                        <>
                          <p>Le tampon de votre entreprise, photographié ou scanné sur fond blanc.</p>
                          <p>PNG à fond transparent conseillé, 50 Ko maximum.</p>
                          <p>Il s’affiche à côté de votre signature.</p>
                          <p>Réservé au Pro. Sur les tickets 80 mm, il est facultatif.</p>
                        </>
                      ) : (
                        <>
                          <p>Your company stamp, photographed or scanned on a white background.</p>
                          <p>Transparent-background PNG recommended, 50 KB maximum.</p>
                          <p>It appears next to your signature.</p>
                          <p>Pro only. On 80 mm tickets it is optional.</p>
                        </>
                      ),
                    }}
                    value={stampUrl}
                    onChange={setStampUrl}
                    disabled={!canUseBranding}
                  />
                </div>
              </div>
            </Card>

            {/* Option ticket thermique 80 mm */}
            <Card className="p-4 sm:p-5">
              <label
                className={`flex items-start gap-3.5 ${
                  canUseBranding ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={showStampOnTicket}
                    disabled={!canUseBranding}
                    onChange={(e) => setShowStampOnTicket(e.target.checked)}
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    <span className="block text-sm font-bold text-slate-900">
                      {fr ? 'Afficher le cachet sur les tickets 80 mm' : 'Show the stamp on 80 mm tickets'}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500">
                    {fr
                      ? 'Recommandé pour les commerces avec imprimante thermique. Les tickets n’affichent jamais la signature manuscrite pour préserver le format compact.'
                      : 'Recommended for thermal printers. Tickets never show handwritten signature to keep the receipt compact.'}
                  </span>
                </div>
              </label>
            </Card>

            {/* White Label : Couleurs personnalisées & Presets */}
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Palette className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {fr ? 'Identité visuelle de vos documents (White Label)' : 'Document Visual Identity (White Label)'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {fr
                        ? 'Sélectionnez un style de designer ou ajustez vos couleurs manuellement'
                        : 'Choose a designer preset or tune your colors manually'}
                    </p>
                  </div>
                </div>
                {!canUseWhiteLabel && <ProBadge label="Add-on White label" />}
              </div>

              {/* Sélecteur des 10 Presets White Label avec prévisualisation en direct */}
              <VisualPresetsSelector
                selectedPrimary={brandPrimary}
                selectedAccent={brandAccent}
                onSelect={(preset) => {
                  setBrandPrimary(preset.primary);
                  setBrandAccent(preset.accent);
                }}
                canUseWhiteLabel={canUseWhiteLabel}
                locale={locale}
              />

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  {fr ? 'Ajustement précis des codes couleurs :' : 'Precise hex color tuning:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                  <label htmlFor="brandPrimary" className="block text-xs font-bold text-slate-800">
                    {fr ? 'Couleur principale' : 'Primary color'}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {fr ? 'Titres, filets, en-tête de document' : 'Headers, borders, company title'}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="brandPrimary"
                      type="color"
                      value={brandPrimary}
                      disabled={!canUseWhiteLabel}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {brandPrimary.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                  <label htmlFor="brandAccent" className="block text-xs font-bold text-slate-800">
                    {fr ? 'Couleur d’accentuation' : 'Accent color'}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {fr ? 'Montant total net à payer mis en valeur' : 'Highlighted net total amount due'}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="brandAccent"
                      type="color"
                      value={brandAccent}
                      disabled={!canUseWhiteLabel}
                      onChange={(e) => setBrandAccent(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {brandAccent.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              </div>

              {canUseWhiteLabel && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandPrimary(DEFAULT_BRAND.primary);
                      setBrandAccent(DEFAULT_BRAND.accent);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{fr ? 'Revenir à la palette MyCashBill par défaut' : 'Reset to default MyCashBill theme'}</span>
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ONGLET 2 : Fiscalité & Coordonnées (Pays, Forme juridique, NIF, RCCM, Adresse) */}
        {activeTab === 'legal' && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {fr ? 'Coordonnées et Fiscalité OHADA' : 'Legal and OHADA Tax Details'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {fr
                        ? 'Informations juridiques imposées par l’Acte Uniforme OHADA'
                        : 'Required business and legal information under OHADA uniform law'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pays */}
                <div>
                  <label htmlFor="country" className="block text-xs font-bold text-slate-800 mb-1">
                    {fr ? 'Pays d’enregistrement' : 'Registration Country'}
                  </label>
                  <div className="relative">
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="CM">🇨🇲 Cameroun (XAF - FCFA)</option>
                      <option value="CI">🇨🇮 Côte d’Ivoire (XOF - FCFA)</option>
                      <option value="SN">🇸🇳 Sénégal (XOF - FCFA)</option>
                      <option value="GA">🇬🇦 Gabon (XAF - FCFA)</option>
                      <option value="CG">🇨🇬 Congo (XAF - FCFA)</option>
                      <option value="BJ">🇧🇯 Bénin (XOF - FCFA)</option>
                      <option value="TG">🇹🇬 Togo (XOF - FCFA)</option>
                    </select>
                  </div>
                </div>

                {/* Nom commercial */}
                <div>
                  <label htmlFor="businessName" className="block text-xs font-bold text-slate-800 mb-1">
                    {fr ? 'Nom commercial (Enseigne)' : 'Commercial Name / Brand'}
                  </label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={fr ? 'Ex : Douala Prestige' : 'Ex: Prestige Tech'}
                  />
                </div>

                {/* Raison sociale */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="legalName" className="block text-xs font-bold text-slate-800">
                      {fr ? 'Raison sociale officielle' : 'Official Legal Name'}
                    </label>
                    {!pro && <ProBadge size="sm" />}
                  </div>
                  <Input
                    id="legalName"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder={fr ? 'Ex : SARL KASHBILL' : 'Ex: KASHBILL LLC'}
                  />
                </div>

                {/* Forme juridique avec puces rapides */}
                <div>
                  <label htmlFor="legalForm" className="block text-xs font-bold text-slate-800 mb-1">
                    {fr ? 'Forme juridique' : 'Legal Form'}
                  </label>
                  <Input
                    id="legalForm"
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    placeholder={t('legalFormPlaceholder')}
                  />
                  {/* Raccourcis 1-clic */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">{fr ? 'Suggestions :' : 'Quick fill:'}</span>
                    {COMMON_LEGAL_FORMS.map((form) => (
                      <button
                        key={form}
                        type="button"
                        onClick={() => setLegalForm(form)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition ${
                          legalForm === form
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {form}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéro contribuable / NIU / NIF */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="taxId" className="block text-xs font-bold text-slate-800">
                      {fr ? 'Identifiant fiscal (NIF / NIU)' : 'Tax Identification Number (TIN)'}
                    </label>
                    {!pro && <ProBadge size="sm" />}
                  </div>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder={fr ? 'Ex : M052300012345Z' : 'Ex: TAX-12345-X'}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {fr ? 'Mention légale obligatoire en zone CEMAC/UEMOA' : 'Mandatory tax notice on official invoices'}
                  </p>
                </div>

                {/* RCCM */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="rccm" className="block text-xs font-bold text-slate-800">
                      {fr ? 'Registre du Commerce (RCCM)' : 'Trade Register Number (RCCM)'}
                    </label>
                    {!pro && <ProBadge size="sm" />}
                  </div>
                  <Input
                    id="rccm"
                    value={rccm}
                    onChange={(e) => setRccm(e.target.value)}
                    placeholder={fr ? 'Ex : RC/DLA/2024/B/123' : 'Ex: RCCM-2024-B-99'}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {fr ? 'Enregistrement au greffe du tribunal' : 'Commercial registry registration'}
                  </p>
                </div>

                {/* Adresse légale du siège */}
                <div className="sm:col-span-2">
                  <label htmlFor="legalAddress" className="block text-xs font-bold text-slate-800 mb-1">
                    {fr ? 'Adresse légale du siège social' : 'Registered Office Address'}
                  </label>
                  <Input
                    id="legalAddress"
                    value={legalAddress}
                    onChange={(e) => setLegalAddress(e.target.value)}
                    placeholder={fr ? 'Ex : Boulevard de la Liberté, Akwa, BP 1234 Douala' : 'Ex: Main Street, Suite 400'}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ONGLET 3 : Facturation & Mentions (En-tête, Pied de page, CGV, Décimales) */}
        {activeTab === 'invoicing' && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {fr ? 'En-têtes, Pieds de page et CGV' : 'Headers, Footers and Terms'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {fr
                        ? 'Personnalisez les textes d’accompagnement et mentions contractuelles'
                        : 'Customize invoice notes, thank you messages and legal terms'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Slogan d'en-tête */}
              <div>
                <label htmlFor="headerText" className="block text-xs font-bold text-slate-800 mb-1">
                  {fr ? 'Slogan ou texte d’en-tête' : 'Header tagline or custom note'}
                </label>
                <Input
                  id="headerText"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder={fr ? 'Ex : Vente de matériel informatique garanti 1 an' : 'Ex: Certified IT hardware & professional support'}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {fr ? 'Apparaît directement sous le bloc en-tête sur vos documents A4.' : 'Displayed right below the header on A4 documents.'}
                </p>
              </div>

              {/* Pied de page */}
              <div>
                <label htmlFor="footerText" className="block text-xs font-bold text-slate-800 mb-1">
                  {fr ? 'Pied de page (Remerciements ou instructions)' : 'Footer text (Thank you message or payment instructions)'}
                </label>
                <Input
                  id="footerText"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder={fr ? 'Ex : Merci pour votre confiance ! Marchandise ni reprise ni échangée.' : 'Ex: Thank you for your business! Payment due upon receipt.'}
                />
              </div>

              {/* CGV */}
              <div>
                <label htmlFor="cgvText" className="block text-xs font-bold text-slate-800 mb-1">
                  {fr ? 'Conditions Générales de Vente (CGV)' : 'Terms & Conditions (T&C)'}
                </label>
                <textarea
                  id="cgvText"
                  rows={4}
                  value={cgvText}
                  onChange={(e) => setCgvText(e.target.value)}
                  placeholder={
                    fr
                      ? 'Renseignez ici vos conditions générales de vente : délais de livraison, garanties, pénalités de retard… Elles s’afficheront en annexe de vos factures.'
                      : 'Enter your standard terms: delivery times, return policies, late payment penalties… They will appear as an annex on your documents.'
                  }
                  className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 shadow-2xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                />
              </div>
            </Card>

            {/* Décimales sur les documents */}
            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {fr ? 'Précision des montants (Décimales)' : 'Amount Precision (Decimals)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {fr
                      ? 'Format d’affichage des prix sur tous vos devis, factures et tickets'
                      : 'Currency format on all quotes, invoices and receipts'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {([0, 1, 2] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDecimalPlaces(d)}
                    className={`flex-1 min-w-24 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition ${
                      decimalPlaces === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d === 0 ? (fr ? 'Aucune (Arrondi entier)' : 'None (Integer)') : fr ? `${d} décimale${d > 1 ? 's' : ''}` : `${d} decimal${d > 1 ? 's' : ''}`}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">{fr ? 'Exemple de rendu :' : 'Display example:'}</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {decimalPlaces === 0
                    ? '12\u202F345 FCFA'
                    : decimalPlaces === 1
                    ? '12\u202F345,0 FCFA'
                    : '12\u202F345,00 FCFA'}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Barre d'Action Desktop & Mobile Flottante */}
        <div className="sticky bottom-3 z-30 sm:static sm:z-auto">
          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-lg sm:shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {isDirty
                  ? fr
                    ? 'Modifications non enregistrées'
                    : 'Unsaved modifications'
                  : fr
                  ? 'Paramètres à jour'
                  : 'Settings up to date'}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              loading={saving}
              className="px-6 py-2.5 font-bold shadow-md shadow-emerald-600/20"
            >
              {saving
                ? fr
                  ? 'Enregistrement…'
                  : 'Saving…'
                : fr
                ? 'Enregistrer'
                : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
