'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Check, Sparkles, Lock } from 'lucide-react';
import { VISUAL_PRESETS, type VisualPreset } from '@/lib/branding/presets';
import { haptic } from '@/lib/device/haptics';

export function VisualPresetsSelector({
  selectedPrimary,
  selectedAccent,
  onSelect,
  canUseWhiteLabel,
  locale = 'fr',
}: {
  selectedPrimary: string;
  selectedAccent: string;
  onSelect: (preset: VisualPreset) => void;
  canUseWhiteLabel: boolean;
  locale?: string;
}) {
  const isEn = locale === 'en';

  const handleSelect = (preset: VisualPreset) => {
    if (!canUseWhiteLabel) return;
    haptic('light');
    onSelect(preset);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>🎨 {isEn ? '10 White Label Visual Presets' : '10 Modèles d’Identité Visuelle White Label'}</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-extrabold uppercase">
              Pro + White Label
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Click any preset to preview it live on your document header above.'
              : 'Cliquez sur un modèle pour visualiser immédiatement le rendu en direct sur votre en-tête ci-dessus.'}
          </p>
        </div>

        {!canUseWhiteLabel && (
          <Link
            href={'/upgrade' as Route}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
          >
            <Lock className="h-3 w-3 text-amber-600" />
            <span>{isEn ? 'Unlock White Label' : 'Débloquer l’option'}</span>
          </Link>
        )}
      </div>

      {/* Grille des 10 presets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {VISUAL_PRESETS.map((preset) => {
          const isSelected =
            selectedPrimary.toUpperCase() === preset.primary.toUpperCase() &&
            selectedAccent.toUpperCase() === preset.accent.toUpperCase();

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelect(preset)}
              disabled={!canUseWhiteLabel}
              title={`${preset.name} — ${preset.description}`}
              className={`group relative text-left rounded-xl border p-2.5 transition-all text-xs flex flex-col justify-between overflow-hidden shadow-2xs ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/30 shadow-xs'
                  : canUseWhiteLabel
                  ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs active:scale-98 cursor-pointer'
                  : 'border-slate-200 bg-slate-50/60 opacity-70 cursor-not-allowed'
              }`}
            >
              {/* Ligne d'accentuation supérieure du preset */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all"
                style={{ backgroundColor: preset.primary }}
              />

              <div className="space-y-1.5 w-full">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-base shrink-0">{preset.icon}</span>
                  {isSelected && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-bold text-slate-900 leading-tight truncate">
                    {isEn ? preset.nameEn : preset.name}
                  </p>
                  <span className="inline-block text-[9.5px] font-semibold text-slate-500 mt-0.5">
                    {isEn ? preset.tagEn : preset.tag}
                  </span>
                </div>
              </div>

              {/* Aperçu des couleurs & simulation document */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5 w-full">
                {/* Barre bicolore : Primaire (65%) / Accent (35%) */}
                <div className="flex h-2.5 w-full rounded-full overflow-hidden shadow-2xs border border-black/5">
                  <div
                    className="h-full transition-colors"
                    style={{ width: '65%', backgroundColor: preset.primary }}
                  />
                  <div
                    className="h-full transition-colors"
                    style={{ width: '35%', backgroundColor: preset.accent }}
                  />
                </div>

                {/* Micro-carte d'aperçu d'encadré Net à payer */}
                <div
                  className="rounded-md px-1.5 py-1 text-[8.5px] font-bold text-white flex items-center justify-between"
                  style={{
                    backgroundColor: preset.primary,
                    borderBottom: `2px solid ${preset.accent}`,
                  }}
                >
                  <span className="opacity-80 scale-90 origin-left">NET</span>
                  <span className="font-mono scale-90 origin-right">FCFA</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
