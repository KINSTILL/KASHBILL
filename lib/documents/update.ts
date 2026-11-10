import { prisma } from '@/lib/db';
import type { DocType, Locale, User } from '@prisma/client';
import { computeContentHash } from './hash';
import { computePayload, type DocumentPayloadInput } from './payload';
import { evaluateDocument } from '@/lib/fraud/rules';
import { checkRequiredCompanyFields } from '@/lib/validators/documents';

export type UpdateDocumentInput = {
  user: User;
  documentId: string;
  type: DocType;
  clientId: string | null;
  locale: Locale;
  payload: DocumentPayloadInput;
};

export type UpdateDocumentResult =
  | { ok: true; documentId: string; number: string }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_SENT' | 'TYPE_CHANGED' | 'CLIENT_NOT_FOUND' }
  | { ok: false; reason: 'MISSING_COMPANY_FIELDS'; missingFields: string[]; message: string }
  | { ok: false; reason: 'BLOCKED'; blockedReasons: string[] };

/**
 * Met à jour un BROUILLON (document non envoyé). Le numéro, le jeton de vérification
 * et la date de création sont conservés ; le contenu et son empreinte sont recalculés.
 */
export async function updateDraftDocument(input: UpdateDocumentInput): Promise<UpdateDocumentResult> {
  const doc = await prisma.document.findFirst({
    where: { id: input.documentId, userId: input.user.id },
    select: {
      id: true,
      number: true,
      type: true,
      mode: true,
      createdAt: true,
      sentViaWhatsAppAt: true,
      sentViaEmailAt: true,
    },
  });
  if (!doc) return { ok: false, reason: 'NOT_FOUND' };
  if (doc.sentViaWhatsAppAt || doc.sentViaEmailAt) return { ok: false, reason: 'ALREADY_SENT' };
  // Le type détermine le préfixe de numérotation : on ne le change pas en cours de route.
  if (doc.type !== input.type) return { ok: false, reason: 'TYPE_CHANGED' };

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, userId: input.user.id },
      select: { id: true },
    });
    if (!client) return { ok: false, reason: 'CLIENT_NOT_FOUND' };
  }

  const missing = checkRequiredCompanyFields(input.type, {
    taxId: input.user.taxId,
    rccm: input.user.rccm,
    legalName: input.user.legalName,
    legalAddress: input.user.legalAddress,
  });
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'MISSING_COMPANY_FIELDS',
      missingFields: missing,
      message: `Complétez votre profil entreprise (${missing.join(', ')}) pour émettre ce document.`,
    };
  }

  const computed = computePayload(input.payload);

  const fraudEval = await evaluateDocument({
    user: input.user,
    docType: input.type,
    mode: doc.mode,
    payload: computed,
    totalAmountFcfa: computed.total,
    clientId: input.clientId,
    contentHash: '',
  });
  if (fraudEval.blocked) {
    return {
      ok: false,
      reason: 'BLOCKED',
      blockedReasons: fraudEval.flags.filter((f) => f.severity === 'CRITICAL').map((f) => f.reason),
    };
  }

  const contentHash = computeContentHash({
    userId: input.user.id,
    docType: input.type,
    number: doc.number,
    locale: input.locale,
    payload: computed,
    createdAt: doc.createdAt.toISOString(),
  });

  await prisma.document.update({
    where: { id: doc.id },
    data: {
      clientId: input.clientId,
      locale: input.locale,
      payload: computed,
      contentHash,
      dueDate: input.payload.dueDate ? new Date(input.payload.dueDate) : null,
      editCount: { increment: 1 },
    },
  });

  return { ok: true, documentId: doc.id, number: doc.number };
}
