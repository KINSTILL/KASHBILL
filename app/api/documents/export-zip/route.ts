import type { NextRequest } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { getHistoryWindowDays, isPro } from '@/lib/auth/plan';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const url = new URL(req2.url);
      const fromParam = url.searchParams.get('from');
      const toParam = url.searchParams.get('to');

      const windowDays = getHistoryWindowDays(user);
      const planLimitDate = windowDays !== null
        ? new Date(Date.now() - windowDays * 86_400_000)
        : null;

      let since: Date | null = planLimitDate;
      let until: Date | null = null;

      if (fromParam) {
        const from = new Date(fromParam);
        if (isNaN(from.getTime())) return jsonError('VALIDATION_ERROR', 'Paramètre from invalide', 422);
        since = planLimitDate && from < planLimitDate ? planLimitDate : from;
      }
      if (toParam) {
        const to = new Date(toParam);
        if (isNaN(to.getTime())) return jsonError('VALIDATION_ERROR', 'Paramètre to invalide', 422);
        to.setHours(23, 59, 59, 999);
        until = to;
      }

      const documents = await prisma.document.findMany({
        where: {
          userId: user.id,
          ...(since || until
            ? {
                createdAt: {
                  ...(since ? { gte: since } : {}),
                  ...(until ? { lte: until } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true } } },
      });

      if (documents.length === 0) {
        return jsonError('NOT_FOUND', 'Aucun document sur cette période', 404);
      }

      const zip = new JSZip();
      const manifest: Array<{ number: string; type: string; date: string; client: string | null; total: number; hash: string | null }> = [];

      for (const doc of documents) {
        if (doc.pdfPath) {
          try {
            const buffer = await readFile(path.join(process.cwd(), doc.pdfPath));
            zip.file(`${doc.number}.pdf`, buffer);
          } catch {
            // PDF manquant, on l'ignore
          }
        }
        const payload = doc.payload as { total?: number };
        manifest.push({
          number: doc.number,
          type: doc.type,
          date: doc.createdAt.toISOString(),
          client: doc.client?.name ?? null,
          total: payload.total ?? 0,
          hash: doc.contentHash ?? null,
        });
      }

      const csvHeader = 'numero,type,date,client,total_fcfa,hash_sha256\n';
      const csvRows = manifest
        .map((m) => [m.number, m.type, m.date, m.client ?? '', String(m.total), m.hash ?? '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','))
        .join('\n');
      zip.file('manifest.csv', csvHeader + csvRows);

      const periodLabel = fromParam || toParam
        ? `Période : ${fromParam?.slice(0, 10) ?? 'début'} → ${toParam?.slice(0, 10) ?? "aujourd'hui"}`
        : 'Période : toute la fenêtre autorisée';

      zip.file('README.txt', [
        'MyCashBill — Export de documents',
        `Généré le ${new Date().toISOString()}`,
        `Utilisateur : ${user.phone}`,
        periodLabel,
        `Nombre de documents : ${documents.length}`,
        '',
        'Contenu :',
        '- PDF de chaque document',
        '- manifest.csv (numéro, type, date, client, montant, hash SHA-256)',
        '',
        'IMPORTANT :',
        "MyCashBill n'est pas un service d'archivage légal.",
        'Vous êtes responsable de la conservation de ces documents pendant 10 ans.',
        "Le hash SHA-256 de chaque document est dans manifest.csv (preuve d'intégrité).",
      ].join('\n'));

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      await writeAudit({
        actorId: user.id, targetId: user.id, action: 'documents_exported_zip',
        meta: { count: documents.length, from: fromParam, to: toParam, isPro: isPro(user) },
        ip, userAgent,
      });

      const periodTag = fromParam || toParam
        ? `-${(fromParam ?? 'all').slice(0, 10)}_${(toParam ?? 'now').slice(0, 10)}`
        : '';
      const filename = `mycashbill-export${periodTag}-${new Date().toISOString().slice(0, 10)}.zip`;

      return new Response(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(zipBuffer.byteLength),
        },
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

