'use client';

/**
 * Compresse une image côté client avant upload.
 * Réduit à maxWidth × maxHeight, qualité JPEG/PNG.
 */
export async function compressImage(
  file: File,
  maxSize: number,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
      mime,
      quality
    );
  });
}

