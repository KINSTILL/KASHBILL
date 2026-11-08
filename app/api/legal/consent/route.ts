import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/api/server';
import { recordConsent } from '@/lib/legal/queries';
import { LEGAL_SLUG_LIST, type LegalSlug } from '@/lib/legal/constants';

const schema = z.object({
  consents: z.array(z.object({
    slug: z.enum(LEGAL_SLUG_LIST as [LegalSlug, ...LegalSlug[]]),
    version: z.string().min(1).max(20),
  })).min(1),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const data = schema.parse(await req2.json());
      for (const c of data.consents) {
        await recordConsent(user.id, c.slug, c.version, getClientIp(req), getUserAgent(req));
      }
      return jsonOk({ ok: true, count: data.consents.length });
    });
  } catch (err) { return handleApiError(err); }
}

