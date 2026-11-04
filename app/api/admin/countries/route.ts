import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { invalidateCountryCache } from '@/lib/countries/config';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_countries', async () => {
      const countries = await prisma.countryTaxConfig.findMany({ orderBy: { countryCode: 'asc' } });
      return jsonOk({ countries });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const countrySchema = z.object({
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/),
  countryNameFr: z.string().min(1).max(100),
  countryNameEn: z.string().min(1).max(100),
  currency: z.string().length(3),
  taxIdLabel: z.string().min(1).max(20),
  rccmLabel: z.string().min(1).max(20),
  vatRate: z.number().min(0).max(50).nullable(),
  requiredFields: z.array(z.string()).default([]),
  legalMentionsTemplate: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_countries', async (req2, { user: admin, ip, userAgent }) => {
      const body = await req2.json();
      const data = countrySchema.parse(body);

      const existing = await prisma.countryTaxConfig.findUnique({ where: { countryCode: data.countryCode } });
      if (existing) {
        return new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Pays existant' } }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const country = await prisma.countryTaxConfig.create({
        data: {
          ...data,
          vatRate: data.vatRate !== null ? data.vatRate : null,
          requiredFields: data.requiredFields,
        },
      });

      invalidateCountryCache(data.countryCode);

      await writeAudit({
        actorId: admin.id,
        action: 'admin_country_created',
        meta: { countryCode: data.countryCode },
        ip,
        userAgent,
      });

      return jsonOk({ country }, 201);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

