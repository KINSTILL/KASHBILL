'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { ImageKind } from '@/lib/validators/image';

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  kind?: ImageKind;
  label?: string;
  disabled?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  kind = 'logo',
  label = 'Image',
  disabled = false,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur lors de l'upload");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Erreur réseau lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-24 max-w-full rounded object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-2 block w-full rounded bg-red-50 py-1 text-center text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Supprimer
            </button>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            disabled={disabled || uploading}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="text-xs"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Upload en cours...
              </span>
            ) : (
              `Sélectionner ${label}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

