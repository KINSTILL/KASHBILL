'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, Loader2, Sparkles, X, Check, FileText } from 'lucide-react';
import { checkImageQuality, ImageQualityResult } from './QualityChecker';
import { ScanResult } from '@/lib/validators/quote-scan';
import { ScanSplitView } from './ScanSplitView';
import type { DocType } from '@prisma/client';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onApplyToForm: (data: ScanResult['data'], selectedType: DocType) => void;
}

export function ScanModal({ isOpen, onClose, currency, onApplyToForm }: ScanModalProps) {
  const [docType, setDocType] = useState<DocType>('DEVIS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<ImageQualityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setScanResult(null);
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

    setIsScanning(true);
    setErrorMessage(null);
    setScanStep('Extraction structurée et transcription avec DeepSeek Vision...');

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
      setScanResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec du scan du document';
      setErrorMessage(msg);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setQuality(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleApply = (scannedData: ScanResult['data']) => {
    onApplyToForm(scannedData, docType);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Scanner un devis ou document</h2>
              <p className="text-xs text-muted-foreground">
                Extraction assistée par IA avec DeepSeek Vision
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {scanResult && previewUrl ? (
            /* Vue comparative Split-View après scan */
            <ScanSplitView
              imageUrl={previewUrl}
              scanResult={scanResult}
              currency={currency}
              onApply={handleApply}
              onCancel={() => setScanResult(null)}
            />
          ) : (
            /* Écran d'acquisition et de contrôle qualité */
            <div className="space-y-6">
              {/* Choix du type de document */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Type de document à créer
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'DEVIS' as DocType, label: 'Devis (recommandé)' },
                    { type: 'FACTURE' as DocType, label: 'Facture' },
                    { type: 'RECU' as DocType, label: 'Reçu' },
                    { type: 'BORDEREAU' as DocType, label: 'Bordereau livraison' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setDocType(item.type)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        docType === item.type
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {docType === item.type && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone d'import ou prise de photo */}
              {!selectedFile ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-semibold mb-1">
                    Prenez une photo nette de votre devis manuscrit
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Pour une lecture optimale, assurez-vous d’un bon éclairage et d’un document bien à plat.
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
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow flex items-center gap-2 hover:bg-primary/90"
                    >
                      <Camera className="w-4 h-4" />
                      Prendre une photo
                    </button>

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
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choisir une photo
                    </button>
                  </div>
                </div>
              ) : (
                /* Prévisualisation + Diagnostic de qualité */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Image */}
                    <div className="relative rounded-xl border border-border bg-slate-950 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[320px]">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Document sélectionné"
                          className="max-h-[300px] w-auto object-contain p-2"
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
                        title="Changer d'image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Diagnostic Qualité */}
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-foreground">
                            Contrôle qualité photo
                          </h4>
                          {isAnalyzing ? (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" /> Analyse...
                            </span>
                          ) : quality?.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3 h-3" /> Photo nette (Score: {quality.score}/100)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3" /> Attention (Score: {quality?.score}/100)
                            </span>
                          )}
                        </div>

                        {/* Alertes spécifiques */}
                        {quality && quality.issues.length > 0 && (
                          <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                            {quality.issues.includes('TOO_DARK') && (
                              <p className="flex items-center gap-1.5">
                                • L'éclairage est trop sombre, risque d'erreur de lecture.
                              </p>
                            )}
                            {quality.issues.includes('TOO_BRIGHT') && (
                              <p className="flex items-center gap-1.5">
                                • La photo est surexposée ou présente un reflet blanc.
                              </p>
                            )}
                            {quality.issues.includes('TOO_BLURRY') && (
                              <p className="flex items-center gap-1.5">
                                • La photo semble floue, privilégiez une prise bien stable.
                              </p>
                            )}
                            {quality.issues.includes('TOO_SMALL') && (
                              <p className="flex items-center gap-1.5">
                                • La résolution est faible, rapprochez-vous du texte.
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          DeepSeek Vision effectuera deux passes de contrôle (extraction et vérification ligne par ligne) pour fiabiliser chaque chiffre.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted font-medium"
                        >
                          Reprendre une photo
                        </button>
                        <button
                          type="button"
                          disabled={isScanning}
                          onClick={handleStartScan}
                          className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Scan en cours...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Lancer l'extraction
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* État de progression & erreurs */}
                  {isScanning && (
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <div className="text-xs">
                        <p className="font-semibold text-primary">{scanStep}</p>
                        <p className="text-muted-foreground text-[11px]">
                          Veuillez patienter quelques instants...
                        </p>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
