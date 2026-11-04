'use client';

import { Input } from '@/components/ui/Input';

export function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Input
      type="password"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="••••••"
      disabled={disabled}
      className="text-center font-mono text-xl tracking-widest h-12"
    />
  );
}

