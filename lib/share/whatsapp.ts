/**
 * Construit un lien wa.me. Si le numéro porte un indicatif explicite (`+…`, `00…`), il fait foi.
 * Sinon, `dialCode` (ex. `+237`) est ajouté au numéro national. Aucun pays n'est imposé.
 */
export function buildWhatsAppUrl(rawPhone: string, message: string, dialCode = '+237'): string {
  const trimmed = rawPhone.trim();
  const encodedText = encodeURIComponent(message);

  if (!trimmed) {
    return `https://wa.me/?text=${encodedText}`;
  }

  const cc = dialCode.replace(/\D/g, '');

  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    const intlDigits = trimmed.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
    if (!intlDigits) {
      return `https://wa.me/?text=${encodedText}`;
    }
    return `https://wa.me/${intlDigits}?text=${encodedText}`;
  }

  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) {
    return `https://wa.me/?text=${encodedText}`;
  }

  // Numéro déjà préfixé par l'indicatif choisi → conservé.
  const withIndicatif =
    cc && digits.startsWith(cc) && digits.length > cc.length + 4
      ? digits
      : cc
        ? `${cc}${digits}`
        : digits;
  return `https://wa.me/${withIndicatif}?text=${encodedText}`;
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
    await navigator.share({ text: message, files: [file] });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'USER_CANCELLED' };
    }
    return { ok: false, reason: 'SHARE_FAILED' };
  }
}
