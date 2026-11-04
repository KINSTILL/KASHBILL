'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ProBadge } from '@/components/ui/ProBadge';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';

interface NfcScannerButtonProps {
  onScan: (data: string) => void;
  onUpgradeRequired?: () => void;
}

export function NfcScannerButton({
  onScan,
  onUpgradeRequired,
}: NfcScannerButtonProps) {
  const { user } = useCurrentUser();
  const pro = user ? isPro(user) : false;
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setSupported(true);
    }
  }, []);

  if (!supported) return null;

  const handleScan = async () => {
    if (!pro) {
      onUpgradeRequired?.();
      return;
    }

    setError(null);
    setScanning(true);

    try {
      type NfcReadingEvent = {
        serialNumber?: string;
        message?: {
          records?: Array<{ recordType: string; encoding?: string; data: BufferSource }>;
        };
      };
      const NDEFReaderClass = (
        window as unknown as {
          NDEFReader: new () => {
            scan: () => Promise<void>;
            addEventListener: (type: string, listener: (ev: NfcReadingEvent) => void) => void;
          };
        }
      ).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      ndef.addEventListener('reading', (event: NfcReadingEvent) => {
        const serialNumber = event.serialNumber;
        let messageText = '';

        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              messageText = textDecoder.decode(record.data);
            }
          }
        }

        const result = messageText || serialNumber || 'NFC-TAG';
        onScan(result);
        setScanning(false);
      });
    } catch {
      setError('Scan NFC indisponible');
      setScanning(false);
    }
  };

  return (
    <div className="inline-flex flex-col">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={scanning}
        onClick={handleScan}
        className="flex items-center gap-1.5 text-xs"
      >
        {scanning ? (
          <span className="flex items-center gap-1.5 text-sage-600">
            <Spinner size="sm" />
            Approchez le badge...
          </span>
        ) : (
          <>
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
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span>Scanner NFC</span>
            {!pro && <ProBadge size="sm" />}
          </>
        )}
      </Button>
      {error && <span className="text-[10px] text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

