import type { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const invoice = await prisma.subscriptionInvoice.findFirst({
        where: { id, userId: user.id },
      });
      if (!invoice || !invoice.pdfPath) {
        return jsonError('NOT_FOUND', 'Facture introuvable', 404);
      }
      try {
        const buffer = await readFile(path.join(process.cwd(), invoice.pdfPath));
        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
            'Content-Length': String(buffer.length),
          },
        });
      } catch {
        return jsonError('INTERNAL', 'Fichier introuvable', 500);
      }
    });
  } catch (err) {
    return handleApiError(err);
  }
}

