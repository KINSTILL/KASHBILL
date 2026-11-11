'use client';

import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

/**
 * Infobulle guidée : ancrée sous son bouton, ouverte au survol sur PC et au clic
 * sur mobile. Le contenu peut contenir une liste d'instructions.
 */
export function InfoTip({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group/tip relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={id}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
      >
        <Info className="h-3 w-3 text-emerald-600" />
        <span>{label}</span>
      </button>
      <div
        id={id}
        role="tooltip"
        className={`absolute left-0 top-full z-30 mt-2 w-72 max-w-[85vw] rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-lg transition-opacity duration-150 ${
          open
            ? 'visible opacity-100'
            : 'pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100'
        }`}
      >
        <span
          aria-hidden
          className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-emerald-200 bg-white"
        />
        {title && <p className="mb-1.5 font-semibold text-slate-900">{title}</p>}
        <div className="space-y-1.5">{children}</div>
      </div>
    </div>
  );
}
