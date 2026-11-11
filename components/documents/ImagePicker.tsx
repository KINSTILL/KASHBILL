'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { compressImage } from '@/lib/device/camera';
import type { ImageKind } from '@/lib/validators/image';
import { InfoTip } from '@/components/ui/InfoTip';
import type { ReactNode } from 'react';

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  kind?: ImageKind;
  label?: string;
  disabled?: boolean;
  /** Guide affiché dans une infobulle à côté du libellé. */
  guide?: { id: string; title: string; body: ReactNode };
}

export function ImagePicker({
  value,
  onChange,
  kind = 'logo',
  label = 'Image',
  disabled = false,
  guide,
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
      const uploadBlob = await compressImage(file, 800, 0.85).catch(() => file);
      const formData = new FormData();
      formData.append('file', uploadBlob, file.name);
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
      {(label || guide) && (
        <div className="flex flex-wrap items-center gap-2">
          {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
          {guide && (
            <InfoTip id={guide.id} label="Guide" title={guide.title}>
              {guide.body}
            </InfoTip>
          )}
        </div>
      )}

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

