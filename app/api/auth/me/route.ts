import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId }) => {
      return jsonOk({
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          businessName: user.businessName,
          city: user.city,
          locale: user.locale,
          role: user.role,
          mode: user.mode,
          proUntil: user.proUntil,
          referralCode: user.referralCode,
          country: user.country,
          legalName: user.legalName,
          taxId: user.taxId,
          rccm: user.rccm,
          legalAddress: user.legalAddress,
          logoUrl: user.logoUrl,
          signatureUrl: user.signatureUrl,
          stampUrl: user.stampUrl,
          headerText: user.headerText,
          footerText: user.footerText,
          cgvText: user.cgvText,
          createdAt: user.createdAt,
        },
        deviceId,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
