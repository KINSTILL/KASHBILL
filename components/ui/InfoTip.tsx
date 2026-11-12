'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const MARGIN = 8; // marge minimale avec le bord de l'écran (px)
const PANEL_WIDTH = 288; // w-72

type Pos = { top: number; left: number; width: number; arrowX: number; above: boolean };

/**
 * Infobulle guidée.
 * - Rendue dans <body> en position fixe : elle n'est jamais rognée par un parent
 *   `overflow: hidden` (cadre de téléphone, cartes, modales).
 * - Positionnée à partir du bouton, puis resserrée dans la fenêtre ; elle passe
 *   au-dessus du bouton s'il n'y a pas de place en dessous.
 * - Tap / clic pour ouvrir et fermer (mobile et PC). Le survol n'agit que pour la
 *   souris, afin qu'un tap sur mobile ne reste pas « collé » ouvert.
 * - Se ferme au clic extérieur et à la touche Échap.
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
      className={`z-[70] rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-lg transition-opacity duration-150 ${
        open && pos ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'
      }`}
    >
      <span
        aria-hidden
        style={{ left: pos?.arrowX ?? 12 }}
        className={`absolute h-3 w-3 rotate-45 border-emerald-200 bg-white ${
          pos?.above ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t'
        }`}
      />
      {title && <p className="mb-1.5 font-semibold text-slate-900">{title}</p>}
      <div className="space-y-1.5">{children}</div>
    </div>
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setPinned((v) => !v)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && enterMouse()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && leaveMouse()}
        aria-expanded={pinned}
        aria-describedby={id}
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:min-h-0 sm:px-2"
      >
        <Info className="h-3 w-3 text-emerald-600" aria-hidden="true" />
        <span>{label}</span>
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
