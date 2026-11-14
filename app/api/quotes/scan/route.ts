import { NextRequest, NextResponse } from 'next/server';
import { scanQuoteImage, QuoteScanError } from '@/lib/ai/deepseek-vision';
import { jsonError } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MiB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageBase64 = '';
    let mimeType = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof Blob)) {
        return jsonError('BAD_REQUEST', 'Fichier manquant ou invalide', 400);
      }

      if (file.size > MAX_FILE_SIZE) {
        return jsonError('BAD_REQUEST', 'Image trop volumineuse (max 25 Mo)', 400);
      }

      mimeType = file.type;
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return jsonError('BAD_REQUEST', 'Format non supporté (JPEG, PNG ou WebP uniquement)', 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
        return jsonError('BAD_REQUEST', 'Payload invalide: imageBase64 requis', 400);
      }
      imageBase64 = body.imageBase64.replace(/^data:[^;]+;base64,/, '');
      mimeType = body.mimeType || 'image/jpeg';

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return jsonError('BAD_REQUEST', 'Format non supporté (JPEG, PNG ou WebP uniquement)', 400);
      }
    } else {
      return jsonError('BAD_REQUEST', 'Content-Type non supporté', 415);
    }

    if (!imageBase64) {
      return jsonError('BAD_REQUEST', 'Données image vides', 400);
    }

    const result = await scanQuoteImage(imageBase64, mimeType);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof QuoteScanError) {
      if (err.code === 'INVALID_SCHEMA') {
        return jsonError('VALIDATION_ERROR', err.message, 422);
      }
      if (err.code === 'TIMEOUT') {
        return jsonError('GATEWAY_ERROR', err.message, 504);
      }
      return jsonError('GATEWAY_ERROR', err.message, 502);
    }

    const message = err instanceof Error ? err.message : 'Erreur interne lors du scan';
    return jsonError('INTERNAL', message, 500);
  }
}
