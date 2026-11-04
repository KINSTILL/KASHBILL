import QRCode from 'qrcode';

/**
 * Génère un QR code (data URL PNG) contenant l'URL de vérification publique.
 * Retourne une data URL base64 utilisable directement dans le PDF.
 */
export async function generateQrCode(
  publicToken: string,
  appUrl: string
): Promise<string> {
  const verifyUrl = `${appUrl}/verify/${publicToken}`;
  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
  });
}

