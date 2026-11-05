'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

const ToastContext = createContext<{ show: (msg: string, type?: Toast['type']) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 space-y-2 md:bottom-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2 text-sm text-white shadow-lg pointer-events-auto ${
              t.type === 'success' ? 'bg-success' : t.type === 'error' ? 'bg-error' : 'bg-slate-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

