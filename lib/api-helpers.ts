import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'WHATSAPP_NOT_CONNECTED'
  | 'GATEWAY_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DEVICE_LIMIT_REACHED'
  | 'DEVICE_NOT_FOUND'
  | 'APPROVAL_EXPIRED'
  | 'APPROVAL_INVALID'
  | 'RECOVERY_CODE_INVALID'
  | 'RECOVERY_CODE_USED'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'REFERRAL_INVALID'
  | 'REFERRAL_SELF'
  | 'REFERRAL_ALREADY_USED'
  | 'PLAN_LIMIT_REACHED'
  | 'PLAN_FEATURE_LOCKED'
  | 'REAUTH_REQUIRED'
  | 'REAUTH_INVALID'
  | 'DOCUMENT_BLOCKED'
  | 'BLACKLISTED'
  | 'CSRF_FAILED';

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(
  code: ErrorCode,
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return jsonError('VALIDATION_ERROR', 'Données invalides', 422, error.flatten().fieldErrors);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[] | undefined) ?? [];
      return jsonError('CONFLICT', 'Cette valeur existe déjà', 409, { fields });
    }
    if (error.code === 'P2025') {
      return jsonError('NOT_FOUND', 'Ressource introuvable', 404);
    }
  }
  console.error('[API ERROR]', error);
  return jsonError('INTERNAL', 'Erreur interne', 500);
}

