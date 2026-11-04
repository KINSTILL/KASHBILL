export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
  const withIndicatif = digits.startsWith('237') ? digits : `237${digits}`;
  return `https://wa.me/${withIndicatif}?text=${encodeURIComponent(message)}`;
}

export type ShareResult =
  | { ok: true }
  | { ok: false; reason: 'SHARE_NOT_SUPPORTED' | 'USER_CANCELLED' | 'SHARE_FAILED' };

export async function shareNative(
  pdfBlob: Blob,
  message: string,
  filename: string
): Promise<ShareResult> {
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    return { ok: false, reason: 'SHARE_NOT_SUPPORTED' };
  }
  try {
    await navigator.share({ title: filename, text: message, files: [file] });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'USER_CANCELLED' };
    }
    return { ok: false, reason: 'SHARE_FAILED' };
  }
}

