export interface ImageQualityResult {
  isValid: boolean;
  score: number; // 0 to 100
  brightness: number; // 0 to 255
  sharpness: number; // standard deviation of laplacian
  issues: Array<'TOO_DARK' | 'TOO_BRIGHT' | 'TOO_BLURRY' | 'TOO_SMALL'>;
}

/**
 * Analyse côté client de la qualité d'une image de devis/document
 * Détecte si l'image est trop sombre, surexposée, floue ou trop petite
 */
export async function checkImageQuality(file: File): Promise<ImageQualityResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      const issues: ImageQualityResult['issues'] = [];

      // Vérification résolution minimale
      if (width < 600 || height < 600) {
        issues.push('TOO_SMALL');
      }

      // Utilisation d'un canvas réduit pour des perfs instantanées (< 10ms)
      const targetWidth = 400;
      const scale = targetWidth / width;
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        // Fallback si canvas non disponible
        resolve({
          isValid: issues.length === 0,
          score: 80,
          brightness: 128,
          sharpness: 50,
          issues,
        });
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;
      const pixelCount = targetWidth * targetHeight;

      // 1. Calcul luminosité moyenne en niveaux de gris (luminance perçue standard Rec. 601)
      const grayscale = new Float32Array(pixelCount);
      let totalBrightness = 0;

      for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4;
        const r = data[offset] ?? 0;
        const g = data[offset + 1] ?? 0;
        const b = data[offset + 2] ?? 0;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscale[i] = gray;
        totalBrightness += gray;
      }

      const avgBrightness = totalBrightness / pixelCount;

      if (avgBrightness < 45) {
        issues.push('TOO_DARK');
      } else if (avgBrightness > 230) {
        issues.push('TOO_BRIGHT');
      }

      // 2. Calcul netteté par approximation Laplacienne 3x3 sur l'image en niveaux de gris
      let laplacianSum = 0;
      let laplacianSqSum = 0;
      let evaluatedCount = 0;

      for (let y = 1; y < targetHeight - 1; y++) {
        const rowOffset = y * targetWidth;
        const prevRowOffset = (y - 1) * targetWidth;
        const nextRowOffset = (y + 1) * targetWidth;

        for (let x = 1; x < targetWidth - 1; x++) {
          const center = grayscale[rowOffset + x] ?? 0;
          const top = grayscale[prevRowOffset + x] ?? 0;
          const bottom = grayscale[nextRowOffset + x] ?? 0;
          const left = grayscale[rowOffset + x - 1] ?? 0;
          const right = grayscale[rowOffset + x + 1] ?? 0;

          const lap = Math.abs(top + bottom + left + right - 4 * center);
          laplacianSum += lap;
          laplacianSqSum += lap * lap;
          evaluatedCount++;
        }
      }

      const meanLap = evaluatedCount > 0 ? laplacianSum / evaluatedCount : 0;
      const varianceLap = evaluatedCount > 0 ? laplacianSqSum / evaluatedCount - meanLap * meanLap : 0;
      const sharpness = Math.sqrt(Math.max(0, varianceLap));

      // Seuil de flou tolérant pour les photos de documents
      if (sharpness < 6) {
        issues.push('TOO_BLURRY');
      }

      // Score global 0-100
      let score = 100;
      if (issues.includes('TOO_DARK')) score -= 40;
      if (issues.includes('TOO_BRIGHT')) score -= 30;
      if (issues.includes('TOO_BLURRY')) score -= 50;
      if (issues.includes('TOO_SMALL')) score -= 30;
      score = Math.max(0, score);

      resolve({
        isValid: issues.length === 0,
        score,
        brightness: Math.round(avgBrightness),
        sharpness: Math.round(sharpness * 10) / 10,
        issues,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de charger l’image pour analyse'));
    };

    img.src = url;
  });
}
