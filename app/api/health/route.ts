import { prisma } from '@/lib/db';
import { jsonOk } from '@/lib/api-helpers';

export async function GET(): Promise<Response> {
  let dbStatus: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  const status = dbStatus === 'ok' ? 200 : 503;
  return jsonOk(
    {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

