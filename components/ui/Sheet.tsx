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
        <Drawer.Overlay className="fixed inset-0 z-40 sheet-backdrop" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white pb-safe">
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden />
          <div className="px-4 pb-6">
            {title && (
              <Drawer.Title className="text-base font-bold text-slate-900 mb-3">
                {title}
              </Drawer.Title>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
