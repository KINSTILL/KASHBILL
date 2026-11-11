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
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-backdrop fixed inset-0 z-40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-sheet border-t border-slate-100 bg-white pb-safe focus:outline-none">
          <div
            className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-slate-200"
            aria-hidden
          />
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
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
