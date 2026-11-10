'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Bouton flottant « Retour en haut » avec jauge circulaire de progression (Proposition 1).
 * Apparaît au-delà de 400px de scroll et remonte la page en douceur.
 */
export function ScrollToTop() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (currentScroll / scrollHeight) * 100));
        setScrollProgress(progress);
      }

      setVisible(currentScroll > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  // Calcul du tracé circulaire SVG (rayon 18, circonférence ~113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Revenir en haut de page"
      className="fixed z-[65] bottom-[86px] sm:bottom-8 right-3.5 sm:right-8 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg shadow-slate-900/15 border border-slate-200/80 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 hover:border-emerald-500 hover:text-emerald-700 focus:outline-none"
    >
      {/* Anneau SVG de progression de scroll */}
      <svg className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
        {/* Piste grise subtile */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2.5"
        />
        {/* Barre de progression émeraude dynamique */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-150 ease-out"
        />
      </svg>

      {/* Icône flèche centrale */}
      <ArrowUp className="h-5 w-5 text-slate-800 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
