import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async () => {
      const evolutionUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
      const evolutionKey = (
        process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY
      )?.trim();
      const configuredInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim() || null;

      if (!evolutionUrl || !evolutionKey) {
        return jsonOk({
          ok: false,
          configured: false,
          reason: 'MISSING_ENV_VARS',
          missing: {
            EVOLUTION_API_URL: !evolutionUrl,
            EVOLUTION_API_KEY: !evolutionKey,
          },
        });
      }

      try {
        const res = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: { apikey: evolutionKey },
          cache: 'no-store',
        });

        if (!res.ok) {
          return jsonOk({
            ok: false,
            configured: true,
            reachable: false,
            httpStatus: res.status,
            reason: res.status === 401 || res.status === 403 ? 'INVALID_API_KEY' : 'HTTP_ERROR',
          });
        }

        const data = await res.json();
        const instances = Array.isArray(data)
          ? data.map((item) => ({
              name: item?.name ?? item?.instance?.instanceName ?? item?.instanceName ?? 'unknown',
              status:
                item?.connectionStatus ?? item?.instance?.status ?? item?.status ?? 'unknown',
            }))
          : [];

        const matched = configuredInstance
          ? instances.find((i) => i.name === configuredInstance)
          : instances.find((i) => i.status === 'open') ?? instances[0];

        return jsonOk({
          ok: Boolean(matched && matched.status === 'open'),
          configured: true,
          reachable: true,
          configuredInstance,
          activeInstance: matched?.name ?? null,
          connectionStatus: matched?.status ?? 'no_instance',
          instances,
        });
      } catch (e) {
        return jsonOk({
          ok: false,
          configured: true,
          reachable: false,
          reason: 'NETWORK_ERROR',
          message: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    });
  } catch (err) {
    return handleApiError(err);
  }
}
