'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Camera,
  Upload,
  AlertTriangle,
  Loader2,
  Zap,
  ArrowLeft,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { checkImageQuality, ImageQualityResult } from '@/components/documents/scan/QualityChecker';
import { ScanResult, ScanConfidence, ScannedQuoteItem } from '@/lib/validators/quote-scan';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { haptic } from '@/lib/device/haptics';
import type { DocType } from '@prisma/client';

export function ScanExpressView({
  clients,
  currency,
}: {
  clients: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === 'fr';

  const [docType, setDocType] = useState<DocType>('DEVIS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<ImageQualityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // État de zoom pour la Split-View
  const [zoom, setZoom] = useState(1);
  const [mobileTab, setMobileTab] = useState<'data' | 'image'>('data');
  const [editableData, setEditableData] = useState<ScanResult['data'] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Animation progressive de la barre verte lors du scan
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      setScanProgress(5);
      setScanStepText(fr ? 'Optimisation et analyse de la photo...' : 'Optimizing and analyzing photo...');

      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev < 30) {
            setScanStepText(fr ? 'Optimisation et analyse de la photo...' : 'Optimizing and analyzing photo...');
            return prev + 5;
          }
          if (prev < 70) {
            setScanStepText(fr ? 'Lecture IA des articles, quantités et prix...' : 'AI reading items, quantities and prices...');
            return prev + 3;
          }
          if (prev < 90) {
            setScanStepText(fr ? 'Vérification croisée et fiabilisation des montants...' : 'Cross-checking and validating totals...');
            return prev + 1;
          }
          return prev;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isScanning, fr]);

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setScanResult(null);
    setEditableData(null);
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsAnalyzing(true);
    try {
      const q = await checkImageQuality(file);
      setQuality(q);
    } catch {
      setQuality(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;

    haptic('medium');
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/quotes/scan', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const msg = errorJson?.error?.message || `Erreur serveur (${res.status})`;
        throw new Error(msg);
      }

      const result: ScanResult = await res.json();
      setScanProgress(100);
      setScanStepText(fr ? 'Lecture terminée avec succès !' : 'Extraction completed successfully!');
      setScanResult(result);
      setEditableData(result.data);
      haptic('medium');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec du scan du document';
      setErrorMessage(msg);
      haptic('heavy');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setQuality(null);
    setScanResult(null);
    setEditableData(null);
    setErrorMessage(null);
    setScanProgress(0);
  };

  const handleLineChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    val: string
  ) => {
    if (!editableData) return;
    const newItems = [...editableData.items];
    const existing = newItems[index];
    if (!existing) return;

    const item: ScannedQuoteItem = {
      description: existing.description,
      quantity: existing.quantity,
      unitPrice: existing.unitPrice,
      total: existing.total,
    };

    if (field === 'description') {
      item.description = val;
    } else {
      const num = val === '' ? null : parseFloat(val);
      if (field === 'quantity') item.quantity = isNaN(num as number) ? null : num;
      if (field === 'unitPrice') item.unitPrice = isNaN(num as number) ? null : num;
      if (item.quantity !== null && item.unitPrice !== null) {
        item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      }
    }
    newItems[index] = item;
    setEditableData({ ...editableData, items: newItems });
  };

  const handleApplyAndRedirect = () => {
    if (!editableData) return;
    haptic('medium');

    // Sauvegarder dans le sessionStorage pour que le formulaire de création le charge directement
    const scanPayload = {
      type: docType,
      scannedData: editableData,
      timestamp: Date.now(),
    };
    try {
      sessionStorage.setItem('kashbill_scanned_quote', JSON.stringify(scanPayload));
    } catch {}

    router.push(`/${locale}/documents/new?from_scan=1` as Route);
  };

  const getConfidenceBadge = (fieldKey: string) => {
    const conf: ScanConfidence = scanResult?.confidence[fieldKey] || 'haute';
    if (conf === 'basse') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-500/15 px-1.5 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {fr ? 'À relire' : 'Verify'}
        </span>
      );
    }
    if (conf === 'moyenne') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-700 bg-yellow-500/15 px-1.5 py-0.5 rounded">
          <Info className="w-3 h-3 text-yellow-600" />
          {fr ? 'Moyen' : 'Fair'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-500/15 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {fr ? 'Conforme' : 'Clear'}
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-10">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/documents/new` as Route}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                <span>Scan express</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-extrabold">
                  <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> IA
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {fr
                ? 'Prenez en photo votre devis ou facture pour remplir le document automatiquement.'
                : 'Take a photo of your quote or invoice to fill the document automatically.'}
            </p>
          </div>
        </div>
      </div>

      {/* VUE 1 : CAPTURE & CONTRÔLE QUALITÉ */}
      {!scanResult && (
        <div className="space-y-5">
          {/* Sélection du type de document */}
          <Card className="p-4 sm:p-5">
            <label className="text-xs font-bold text-slate-800 mb-2.5 block uppercase tracking-wider">
              {fr ? '1. Type de document à créer' : '1. Document type to create'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { type: 'DEVIS' as DocType, label: fr ? 'Devis' : 'Quote', icon: '📝', badge: fr ? 'Recommandé' : 'Recommended' },
                { type: 'FACTURE' as DocType, label: fr ? 'Facture' : 'Invoice', icon: '💼' },
                { type: 'RECU' as DocType, label: fr ? 'Reçu' : 'Receipt', icon: '✅' },
                { type: 'BORDEREAU' as DocType, label: fr ? 'Bordereau' : 'Delivery Note', icon: '🚚' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setDocType(item.type);
                  }}
                  className={`px-3.5 py-3 rounded-2xl text-xs border text-left transition-all ${
                    docType === item.type
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{item.icon}</span>
                    {docType === item.type && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="mt-1 font-bold text-sm text-slate-900">{item.label}</p>
                  {item.badge && (
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Zone de prise de photo / sélection */}
          {!selectedFile ? (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 sm:p-12 text-center rounded-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700 shadow-inner mb-4">
                <Camera className="h-8 w-8 stroke-[2.2]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                {fr ? 'Photographiez votre document' : 'Take a photo of your document'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                {fr
                  ? 'Devis manuscrit, bon de commande papier ou facture imprimée : DeepSeek lit les lignes et les montants pour vous.'
                  : 'Handwritten quotes, paper receipts or invoices: DeepSeek extracts items and totals for you.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                <Button
                  size="lg"
                  onClick={() => cameraInputRef.current?.click()}
                  className="gap-2 shadow-md shadow-emerald-900/10 font-bold"
                >
                  <Camera className="w-5 h-5" />
                  <span>{fr ? 'Prendre une photo' : 'Take a photo'}</span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 font-semibold"
                >
                  <Upload className="w-5 h-5 text-slate-600" />
                  <span>{fr ? 'Choisir dans la galerie' : 'Choose from gallery'}</span>
                </Button>
              </div>
            </Card>
          ) : (
            /* Image sélectionnée + Diagnostic qualité + Barre d'analyse */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prévisualisation photo */}
                <div className="relative rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[380px] shadow-inner">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Aperçu document"
                      className="max-h-[360px] w-auto object-contain p-2"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 shadow"
                    title={fr ? "Changer d'image" : 'Change image'}
                  >
                    ✕
                  </button>
                </div>

                {/* Volet de lancement et vérification */}
                <Card className="p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {fr ? 'Contrôle qualité photo' : 'Photo quality check'}
                      </h4>
                      {isAnalyzing ? (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {fr ? 'Analyse...' : 'Analyzing...'}
                        </span>
                      ) : quality?.isValid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> {fr ? 'Photo nette' : 'Sharp image'} ({quality.score}/100)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> {fr ? 'Qualité moyenne' : 'Fair quality'} ({quality?.score ?? 0}/100)
                        </span>
                      )}
                    </div>

                    {quality && quality.issues.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        {quality.issues.includes('TOO_DARK') && <p>• {fr ? 'Éclairage sombre : allumez la lumière ou rapprochez-vous.' : 'Dark lighting: turn on light or move closer.'}</p>}
                        {quality.issues.includes('TOO_BRIGHT') && <p>• {fr ? 'Photo surexposée ou reflet gênant.' : 'Overexposed image or glare detected.'}</p>}
                        {quality.issues.includes('TOO_BLURRY') && <p>• {fr ? 'Photo floue : stabilisez bien l’appareil.' : 'Blurry image: hold camera steady.'}</p>}
                        {quality.issues.includes('TOO_SMALL') && <p>• {fr ? 'Résolution faible : cadrez plus près du texte.' : 'Low resolution: move closer to text.'}</p>}
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {fr
                        ? 'DeepSeek Vision effectue 2 passes d’extraction et de transcription croisée pour fiabiliser chaque chiffre.'
                        : 'DeepSeek Vision performs 2 passes (extraction & transcription) to verify every number.'}
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <Button variant="outline" size="md" onClick={handleReset} disabled={isScanning}>
                      {fr ? 'Reprendre' : 'Retake'}
                    </Button>
                    <Button
                      size="md"
                      onClick={handleStartScan}
                      disabled={isScanning}
                      className="gap-2 font-bold shadow-md shadow-emerald-900/10"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{fr ? 'Analyse...' : 'Analyzing...'}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>{fr ? 'Lancer le Scan express' : 'Start Scan express'}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* LA BARRE DE CHARGEMENT VERTE (identique à celle du paiement Notch Pay / Kinstill) */}
              {isScanning && (
                <Card className="p-6 border-emerald-200 bg-emerald-50/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{scanStepText}</span>
                    </span>
                    <span className="font-mono text-emerald-700">{scanProgress}%</span>
                  </div>

                  {/* Barre verte animée */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>

                  <p className="text-center text-[11px] text-slate-500">
                    {fr ? 'Veuillez patienter quelques secondes...' : 'Please hold on for a few seconds...'}
                  </p>
                </Card>
              )}

              {errorMessage && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VUE 2 : RÉSULTATS EXTRAITS & VALIDATION SPLIT-VIEW */}
      {scanResult && editableData && previewUrl && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Bannière de confirmation */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Check className="h-5 w-5 stroke-[3]" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  {fr ? 'Lecture terminée avec succès !' : 'Reading completed successfully!'}
                </h3>
                <p className="text-xs text-emerald-800">
                  {fr
                    ? 'Vérifiez les données ci-dessous puis validez pour remplir le formulaire.'
                    : 'Review the data below then click apply to fill the form.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                {fr ? 'Nouveau scan' : 'New scan'}
              </Button>
              <Button size="sm" onClick={handleApplyAndRedirect} className="font-bold gap-1.5 shadow-md shadow-emerald-900/10">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{fr ? 'Valider et remplir le document →' : 'Apply and fill document →'}</span>
              </Button>
            </div>
          </div>

          {/* Onglets mobile */}
          <div className="md:hidden flex border border-slate-200 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMobileTab('data')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mobileTab === 'data' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              {fr ? 'Données lues' : 'Extracted data'} ({editableData.items.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('image')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mobileTab === 'image' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              {fr ? 'Photo originale' : 'Original photo'}
            </button>
          </div>

          {/* Contenu Split-View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volet Photo originale */}
            <div
              className={`rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex-col ${
                mobileTab === 'image' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300 flex items-center justify-between">
                <span className="font-semibold">{fr ? 'Photo originale' : 'Original photo'}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex items-center justify-center overflow-auto min-h-[350px] max-h-[550px]">
                <img
                  src={previewUrl}
                  alt="Original scan"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="max-h-[480px] w-auto object-contain transition-transform duration-150"
                />
              </div>
            </div>

            {/* Volet Données éditables */}
            <Card
              className={`p-4 sm:p-5 flex-col space-y-4 ${
                mobileTab === 'data' ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Client & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">{fr ? 'Client détecté' : 'Client'}</label>
                    {getConfidenceBadge('client')}
                  </div>
                  <input
                    type="text"
                    value={editableData.client ?? ''}
                    onChange={(e) => setEditableData({ ...editableData, client: e.target.value })}
                    placeholder={fr ? 'Nom du client' : 'Client name'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">{fr ? 'Date' : 'Date'}</label>
                    {getConfidenceBadge('date')}
                  </div>
                  <input
                    type="text"
                    value={editableData.date ?? ''}
                    onChange={(e) => setEditableData({ ...editableData, date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lignes d'articles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {fr ? 'Articles & prestations' : 'Items'} ({editableData.items.length})
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {editableData.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        {getConfidenceBadge(`items.${idx}.description`)}
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">{fr ? 'Quantité' : 'Qty'}</label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity ?? ''}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-right font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">{fr ? 'Prix unitaire' : 'Unit price'}</label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice ?? ''}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-right font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Total</label>
                          <div className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-100 text-right font-bold font-mono">
                            {item.total !== null ? `${item.total} ${currency}` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total estimé */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase">{fr ? 'Total estimé' : 'Estimated total'}</span>
                  <p className="text-[11px] text-emerald-700">{fr ? 'Calculé automatiquement' : 'Auto-calculated'}</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-900 font-mono">
                  {editableData.total !== null ? `${editableData.total} ${currency}` : '—'}
                </span>
              </div>

              {/* Grand bouton de validation */}
              <Button
                size="lg"
                fullWidth
                onClick={handleApplyAndRedirect}
                className="font-bold gap-2 shadow-md shadow-emerald-900/10 mt-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{fr ? 'Valider et remplir le document →' : 'Apply and fill document →'}</span>
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
