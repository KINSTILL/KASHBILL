'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

const MARGIN = 8; // marge minimale avec le bord de l'écran (px)
const PANEL_WIDTH = 288; // w-72

type Pos = { top: number; left: number; width: number; arrowX: number; above: boolean };

/**
 * Infobulle / Guide d'aide contextuelle.
 * - Format discret par défaut dans un cercle (« ? ») pour ne pas encombrer l'interface.
 * - Rendue dans <body> en position fixe : jamais rognée par un overflow:hidden.
 * - Tap / clic pour ouvrir et fermer (mobile et PC), survol souris sur desktop.
 * - Fermeture au clic extérieur, touche Échap ou bouton de fermeture.
 */
export function InfoTip({
  id,
  label,
  title,
  variant = 'circle',
  children,
}: {
  id: string;
  label: string;
  title?: string;
  variant?: 'circle' | 'pill';
  children: ReactNode;
}) {
  const [pinned, setPinned] = useState(false); // ouvert par tap / clic
  const [hovered, setHovered] = useState(false); // ouvert par survol souris
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  const open = pinned || hovered;

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, vw - MARGIN * 2);
    const height = panel.offsetHeight;

    const left = Math.min(Math.max(r.left, MARGIN), vw - width - MARGIN);
    const below = r.bottom + MARGIN;
    const aboveTop = r.top - MARGIN - height;
    const above = below + height > vh - MARGIN && aboveTop >= MARGIN;
    const top = above ? aboveTop : Math.max(MARGIN, Math.min(below, vh - MARGIN - height));
    const arrowX = Math.min(Math.max(r.left + r.width / 2 - left - 6, 12), width - 24);

    setPos({ top, left, width, arrowX, above });
  }, []);

  // Positionne avant l'affichage, puis suit le défilement et le redimensionnement.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  // Fermeture : clic extérieur et Échap.
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const enterMouse = () => {
    window.clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  // Petit délai pour laisser la souris passer du bouton au panneau.
  const leaveMouse = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHovered(false), 120);
  };

  const panel = (
    <div
      ref={panelRef}
      id={id}
      role="tooltip"
      onPointerEnter={(e) => e.pointerType === 'mouse' && enterMouse()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && leaveMouse()}
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: pos?.width ?? PANEL_WIDTH,
        maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
        overflowY: 'auto',
      }}
      className={`z-[70] rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs leading-relaxed text-slate-700 shadow-xl transition-opacity duration-150 ${
        open && pos ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'
      }`}
    >
      <span
        aria-hidden
        style={{ left: pos?.arrowX ?? 12 }}
        className={`absolute h-3 w-3 rotate-45 border-slate-200 bg-white ${
          pos?.above ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t'
        }`}
      />
      <div className="flex items-start justify-between gap-2 mb-1.5">
        {title ? (
          <p className="font-bold text-slate-900 text-xs">{title}</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setPinned(false)}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition shrink-0"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1.5 text-slate-600">{children}</div>
    </div>
  );

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setPinned((v) => !v)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && enterMouse()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && leaveMouse()}
        aria-expanded={pinned}
        aria-describedby={id}
        aria-label={title ? `${title} (${label})` : label}
        title={title || label}
        className={
          variant === 'circle'
            ? `inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold leading-none transition-colors shadow-2xs touch-manipulation select-none ${
                open
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                  : 'border-slate-300/80 bg-slate-100/90 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
              }`
            : 'inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:min-h-0 sm:px-2'
        }
      >
        {variant === 'circle' ? (
          <span>?</span>
        ) : (
          <>
            <Info className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
