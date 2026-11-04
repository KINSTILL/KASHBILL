import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { setThresholdValue } from '@/lib/fraud/thresholds';

const schema = z.object({
  value: z.number().int().nonnegative(),
  reason: z.string().min(1).max(300),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_thresholds', async (req2, { user: admin, ip, userAgent }) => {
      const { key } = await params;
      const body = await req2.json();
      const { value, reason } = schema.parse(body);

      const current = await prisma.fraudThreshold.findUnique({ where: { key } });
      if (!current) return jsonError('NOT_FOUND', 'Seuil introuvable', 404);

      // Le plancher/plafond est imposé par l'API. SSH est requis pour passer outre.
      if (value < current.floor || value > current.ceiling) {
        return jsonError(
          'FORBIDDEN',
          `Valeur hors bornes [${current.floor}, ${current.ceiling}]. Modification hors bornes : accès SSH requis.`,
          403
        );
      }

      const oldValue = current.value;
      const updated = await setThresholdValue(key, value, admin.id);

      await writeAudit({
        actorId: admin.id,
        action: 'admin_threshold_updated',
        meta: { key, oldValue, newValue: value, reason },
        ip,
        userAgent,
      });

      return jsonOk({ threshold: updated });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

