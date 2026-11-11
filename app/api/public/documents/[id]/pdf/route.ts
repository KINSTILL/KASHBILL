import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { decryptBuffer } from '@/lib/uploads/crypto';

const SHARED_PDF_DIR = path.join(
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  'shared-pdfs'
);

function verifyShareToken(documentId: string, token: string): boolean {
  const expected = createHmac('sha256', env.JWT_SECRET)
    .update(`share-pdf:${documentId}`)
    .digest('hex')
    .slice(0, 32);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const token = req.nextUrl.searchParams.get('t') ?? '';

    if (!verifyShareToken(id, token)) {
      return new Response('Lien invalide ou expiré', { status: 403 });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true, number: true },
    });

    if (!doc) {
      return new Response('Document introuvable', { status: 404 });
    }

    const filePath = path.join(SHARED_PDF_DIR, `${doc.id}.pdf.enc`);
    const encrypted = await readFile(filePath);
    const pdfBuffer = decryptBuffer(encrypted);

    const safeFilename = `${doc.number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Document PDF indisponible', { status: 404 });
  }
}
