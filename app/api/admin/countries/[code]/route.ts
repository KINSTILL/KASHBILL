import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { invalidateCountryCache } from '@/lib/countries/config';

const patchSchema = z.object({
  countryNameFr: z.string().min(1).max(100).optional(),
  countryNameEn: z.string().min(1).max(100).optional(),
  currency: z.string().length(3).optional(),
  taxIdLabel: z.string().min(1).max(20).optional(),
  rccmLabel: z.string().min(1).max(20).optional(),
  vatRate: z.number().min(0).max(50).nullable().optional(),
  requiredFields: z.array(z.string()).optional(),
  legalMentionsTemplate: z.string().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_countries', async (req2, { user: admin, ip, userAgent }) => {
      const { code } = await params;
      const body = await req2.json();
      const data = patchSchema.parse(body);

      const existing = await prisma.countryTaxConfig.findUnique({ where: { countryCode: code } });
      if (!existing) return jsonError('NOT_FOUND', 'Pays introuvable', 404);

      const country = await prisma.countryTaxConfig.update({
        where: { countryCode: code },
        data,
      });

      invalidateCountryCache(code);

      await writeAudit({
        actorId: admin.id,
        action: 'admin_country_updated',
        meta: { countryCode: code, changes: data },
        ip,
        userAgent,
      });

      return jsonOk({ country });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_countries', async (_req, { user: admin, ip, userAgent }) => {
      const { code } = await params;

      const existing = await prisma.countryTaxConfig.findUnique({ where: { countryCode: code } });
      if (!existing) return jsonError('NOT_FOUND', 'Pays introuvable', 404);

      // Soft delete
      const country = await prisma.countryTaxConfig.update({
        where: { countryCode: code },
        data: { isActive: false },
      });

      invalidateCountryCache(code);

      await writeAudit({
        actorId: admin.id,
        action: 'admin_country_deactivated',
        meta: { countryCode: code },
        ip,
        userAgent,
      });

      return jsonOk({ country });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

