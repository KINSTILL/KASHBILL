'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ProBadge } from '@/components/ui/ProBadge';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';

interface ContactPickerButtonProps {
  onSelect: (contact: { name?: string; phone?: string }) => void;
  onUpgradeRequired?: () => void;
}

interface NavigatorWithContacts extends Navigator {
  contacts?: {
    select: (
      props: string[],
      options?: { multiple?: boolean }
    ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
  };
}

export function ContactPickerButton({
  onSelect,
  onUpgradeRequired,
}: ContactPickerButtonProps) {
  const { user } = useCurrentUser();
  const pro = user ? isPro(user) : false;
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      'contacts' in navigator &&
      'ContactsManager' in window
    ) {
      setSupported(true);
    }
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    if (!pro) {
      onUpgradeRequired?.();
      return;
    }

    try {
      const nav = navigator as NavigatorWithContacts;
      if (!nav.contacts) return;
      const contacts = await nav.contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0 && contacts[0]) {
        const c = contacts[0];
        const name = c.name?.[0] || '';
        const phone = c.tel?.[0] || '';
        onSelect({ name, phone });
      }
    } catch {
      // Annulé par l'utilisateur ou non supporté
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs"
    >
      <svg
        className="h-4 w-4 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>Contacts</span>
      {!pro && <ProBadge size="sm" />}
    </Button>
  );
}

