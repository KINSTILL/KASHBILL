import type { NextRequest } from 'next/server';
import { getCurrentUser, type CurrentUser } from '@/lib/auth/session';
import { jsonError } from '@/lib/api-helpers';
import { canDo, requiresReauth, type AdminAction } from '@/lib/admin/roles';
import { validateReauthToken } from '@/lib/admin/reauth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ─────────────────────────────────────────────
// IP + User-Agent
// ─────────────────────────────────────────────
export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent');
}

// ─────────────────────────────────────────────
// CSRF : header X-Requested-With: fetch obligatoire sur mutations
// ─────────────────────────────────────────────
export function checkCsrf(req: NextRequest): Response | null {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  const header = req.headers.get('x-requested-with');
  if (header !== 'fetch') {
    return jsonError(
      'CSRF_FAILED',
      'En-tête X-Requested-With: fetch requis sur les requêtes de mutation',
      403
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// Auth wrapper pour routes protégées
// ─────────────────────────────────────────────
export type AuthContext = {
  user: CurrentUser['user'];
  deviceId: string;
  ip: string | null;
  userAgent: string | null;
};

export type AuthHandler = (req: NextRequest, ctx: AuthContext) => Promise<Response>;

export async function requireAuth(req: NextRequest, handler: AuthHandler): Promise<Response> {
  const csrf = checkCsrf(req);
  if (csrf) return csrf;

  const current = await getCurrentUser(req);
  if (!current) {
    return jsonError('UNAUTHORIZED', 'Authentification requise', 401);
  }

  return handler(req, {
    user: current.user,
    deviceId: current.deviceId,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

// ─────────────────────────────────────────────
// Auth wrapper pour routes admin
// ─────────────────────────────────────────────
export async function requireAdmin(
  req: NextRequest,
  action: AdminAction,
  handler: AuthHandler
): Promise<Response> {
  const csrf = checkCsrf(req);
  if (csrf) return csrf;

  const current = await getCurrentUser(req);
  if (!current) {
    return jsonError('UNAUTHORIZED', 'Authentification requise', 401);
  }

  if (!canDo(current.user.role, action)) {
    return jsonError('FORBIDDEN', 'Action non autorisée pour ce rôle', 403);
  }

  if (requiresReauth(action)) {
    const reauth = req.headers.get('x-reauth-token');
    const valid = await validateReauthToken(reauth, current.user.id);
    if (!valid) {
      return jsonError('REAUTH_REQUIRED', 'Ré-authentification PIN requise', 401);
    }
  }

  return handler(req, {
    user: current.user,
    deviceId: current.deviceId,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

// ─────────────────────────────────────────────
// Audit log helper
// ─────────────────────────────────────────────
export async function writeAudit(params: {
  actorId?: string | null;
  targetId?: string | null;
  action: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        targetId: params.targetId ?? null,
        action: params.action,
        meta: params.meta ? (params.meta as Prisma.InputJsonValue) : undefined,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log', err);
  }
}

