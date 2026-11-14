'use client';

import React, { useState } from 'react';
import { ScanResult, ScanConfidence, ScannedQuoteItem } from '@/lib/validators/quote-scan';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ScanSplitViewProps {
  imageUrl: string;
  scanResult: ScanResult;
  currency: string;
  onApply: (data: ScanResult['data']) => void;
  onCancel: () => void;
}

export function ScanSplitView({
  imageUrl,
  scanResult,
  currency,
  onApply,
  onCancel,
}: ScanSplitViewProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<'image' | 'data'>('data');
  const [data, setData] = useState<ScanResult['data']>(scanResult.data);
  const confidence = scanResult.confidence;

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const handleResetZoom = () => setZoom(1);

  const getConfidenceStyle = (fieldKey: string) => {
    const conf: ScanConfidence = confidence[fieldKey] || 'haute';
    if (conf === 'basse') {
      return {
        className: 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200',
        badge: (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            À vérifier
          </span>
        ),
      };
    }
    if (conf === 'moyenne') {
      return {
        className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-200',
        badge: (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-500/15 px-1.5 py-0.5 rounded">
            <Info className="w-3 h-3 text-yellow-600" />
            Moyenne
          </span>
        ),
      };
    }
    return {
      className: 'bg-muted/30 border-border text-foreground',
      badge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          Conforme
        </span>
      ),
    };
  };

  const handleLineChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    val: string
  ) => {
    const newItems = [...data.items];
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
    setData({ ...data, items: newItems });
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Sélecteur d'onglets pour mobile */}
      <div className="md:hidden flex border-b border-border bg-muted/40 p-1 rounded-t-xl mb-3">
        <button
          type="button"
          onClick={() => setMobileTab('data')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === 'data' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
          }`}
        >
          Données extraites
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('image')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === 'image' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
          }`}
        >
          Photo originale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
        {/* Volet Photo (gauche / onglet image) */}
        <div
          className={`flex flex-col rounded-xl border border-border bg-slate-950/80 overflow-hidden ${
            mobileTab === 'image' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300">
            <span className="font-medium">Photo du document original</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-1 text-[11px] font-mono">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title="Réinitialiser"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 select-none">
            <img
              src={imageUrl}
              alt="Scan original"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                maxWidth: zoom <= 1 ? '100%' : 'none',
                maxHeight: zoom <= 1 ? '100%' : 'none',
              }}
              className="object-contain rounded shadow-lg"
            />
          </div>
        </div>

        {/* Volet Données extraites (droite / onglet data) */}
        <div
          className={`flex flex-col rounded-xl border border-border bg-card overflow-hidden ${
            mobileTab === 'data' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Champs détectés par DeepSeek</h3>
              <p className="text-[11px] text-muted-foreground">
                Les montants surlignés en orange doivent être relus avec la photo.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Métadonnées Client & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Client détecté</label>
                  {getConfidenceStyle('client').badge}
                </div>
                <input
                  type="text"
                  value={data.client || ''}
                  onChange={(e) => setData({ ...data, client: e.target.value })}
                  placeholder="Nom du client"
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-primary ${
                    getConfidenceStyle('client').className
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Date détectée</label>
                  {getConfidenceStyle('date').badge}
                </div>
                <input
                  type="text"
                  value={data.date || ''}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-primary ${
                    getConfidenceStyle('date').className
                  }`}
                />
              </div>
            </div>

            {/* Liste des lignes / items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">
                  Articles et prestations ({data.items.length})
                </span>
              </div>

              <div className="space-y-2">
                {data.items.map((item, idx) => {
                  const descConf = getConfidenceStyle(`items.${idx}.description`);
                  const qtyConf = getConfidenceStyle(`items.${idx}.quantity`);
                  const priceConf = getConfidenceStyle(`items.${idx}.unitPrice`);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-medium text-muted-foreground">
                          Ligne #{idx + 1}
                        </span>
                        <div className="flex gap-1">
                          {descConf.badge}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className={`w-full px-2 py-1 rounded border text-xs ${descConf.className}`}
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Quantité</label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity ?? ''}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            placeholder="Qté"
                            className={`w-full px-2 py-1 rounded border text-xs ${qtyConf.className}`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Prix unit.</label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice ?? ''}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                            placeholder="Prix"
                            className={`w-full px-2 py-1 rounded border text-xs ${priceConf.className}`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Total</label>
                          <div className="px-2 py-1 rounded border border-border bg-muted/50 text-xs font-mono font-medium text-right">
                            {item.total !== null ? `${item.total} ${currency}` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totaux */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sous-total :</span>
                <span className="font-mono font-medium">
                  {data.subtotal !== null ? `${data.subtotal} ${currency}` : '-'}
                </span>
              </div>
              {data.tax !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxes :</span>
                  <span className="font-mono font-medium">{`${data.tax} ${currency}`}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-border font-bold text-sm">
                <span>Total estimé :</span>
                <span className="font-mono text-primary">
                  {data.total !== null ? `${data.total} ${currency}` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted text-muted-foreground font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => onApply(data)}
              className="px-4 py-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Appliquer au formulaire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
