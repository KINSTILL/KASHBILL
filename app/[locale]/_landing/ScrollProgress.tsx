'use client';

import { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      const pct = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-1 bg-transparent">
      <div
        className="h-full bg-emerald-600 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      {progress >= 80 && (
        <div className="absolute right-4 top-2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md">
          Presque !
        </div>
      )}
    </div>
  );
}
