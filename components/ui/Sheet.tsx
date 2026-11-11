'use client';

import { Drawer } from 'vaul';
import type { ReactNode } from 'react';

export function Sheet({
  open,
  onOpenChange,
  children,
  dismissible = true,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
  title?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-backdrop fixed inset-0 z-40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-sheet border-t border-slate-100 bg-white pb-safe">
          <div className="mx-auto mt-3 mb-3 h-1.5 w-12 rounded-full bg-slate-200" aria-hidden />
          <div className="px-5 pb-6">
            {title && (
              <Drawer.Title className="mb-3 text-base font-bold text-ink">{title}</Drawer.Title>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

