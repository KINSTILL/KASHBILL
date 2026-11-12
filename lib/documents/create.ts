import { prisma } from '@/lib/db';
import type { DocType, Locale, Mode, User, Prisma } from '@prisma/client';
import { generateDocumentNumber } from './numbering';
import { computeContentHash } from './hash';
import { computePayload, type DocumentPayloadInput } from './payload';
import { evaluateDocument, detectRepeatedRoundAmounts } from '@/lib/fraud/rules';
import { generatePublicToken } from './verification';
import { generateQrCode } from './integrity';
import { env } from '@/lib/env';
import { checkRequiredCompanyFields } from '@/lib/validators/documents';

export type CreateDocumentInput = {
  user: User;
  clientId: string | null;
  type: DocType;
  mode: Mode;
  locale: Locale;
  payload: DocumentPayloadInput;
};

export type CreateDocumentResult =
  | { ok: true; documentId: string; number: string; publicToken: string; qrCodeDataUrl: string }
  | { ok: false; reason: 'BLOCKED'; blockedReasons: string[]; flags: Array<{ reason: string; severity: string }> }
  | { ok: false; reason: 'MISSING_COMPANY_FIELDS'; missingFields: string[]; message: string };

export async function createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult> {
  const computed = computePayload(input.payload, input.user.decimalPlaces);
  const year = new Date().getFullYear();

  // Vérifie les champs entreprise requis
  const missing = checkRequiredCompanyFields(input.type, {
    taxId: input.user.taxId,
    rccm: input.user.rccm,
    legalName: input.user.legalName,
    legalAddress: input.user.legalAddress,
  });

  if (missing.length > 0) {
    const { DOC_TYPE_CONFIG } = await import('@/lib/documents/doc-type-config');
    const config = DOC_TYPE_CONFIG[input.type];
    return {
      ok: false,
      reason: 'MISSING_COMPANY_FIELDS',
      missingFields: missing,
      message: `Complétez votre profil entreprise (${missing.join(', ')}) pour émettre un ${config.label}.`,
    };
  }

  // Vérifier fraude AVANT la création
  const fraudEval = await evaluateDocument({
    user: input.user,
    docType: input.type,
    mode: input.mode,
    payload: computed,
    totalAmountFcfa: computed.total,
    clientId: input.clientId,
    contentHash: '', // placeholder, recalculé après numérotation
  });

  if (fraudEval.blocked) {
    return {
      ok: false,
      reason: 'BLOCKED',
      blockedReasons: fraudEval.flags.filter((f) => f.severity === 'CRITICAL').map((f) => f.reason),
      flags: fraudEval.flags.map((f) => ({ reason: f.reason, severity: f.severity })),
    };
  }

  // Transaction : numérotation + hash + insert
  const result = await prisma.$transaction(async (tx) => {
    const { getDocTypeConfig } = await import('@/lib/documents/doc-type-config');
    const config = getDocTypeConfig(input.type);
    const number = await generateDocumentNumber(tx, input.user.id, config.numberPrefix, year);

    const contentHash = computeContentHash({
      userId: input.user.id,
      docType: input.type,
      number,
      locale: input.locale,
      payload: computed,
      createdAt: new Date().toISOString(),
    });

    const doc = await tx.document.create({
      data: {
        userId: input.user.id,
        clientId: input.clientId,
        type: input.type,
        mode: input.mode,
        number,
        locale: input.locale,
        payload: computed,
        contentHash,
        watermarked: !input.user.proUntil || input.user.proUntil <= new Date(),
        dueDate: input.payload.dueDate ? new Date(input.payload.dueDate) : null,
        retainUntil: new Date(
          Date.now() + (input.user.proUntil && input.user.proUntil > new Date() ? 365 : 30) * 86_400_000
        ),
      },
    });

    const publicToken = generatePublicToken();
    const qrCodeDataUrl = await generateQrCode(publicToken, env.APP_URL);

    await tx.documentVerification.create({
      data: { documentId: doc.id, publicToken, isAuthentic: true },
    });

    await tx.document.update({
      where: { id: doc.id },
      data: { qrCodeUrl: qrCodeDataUrl },
    });

    return { doc, number, contentHash, publicToken, qrCodeDataUrl };
  });

  // Écrire les flags non bloquants
  const repeatedRound = await detectRepeatedRoundAmounts(input.user.id);
  const allFlags = [
    ...fraudEval.flags.filter((f) => f.severity !== 'CRITICAL'),
    ...(repeatedRound ? [repeatedRound] : []),
  ];

  if (allFlags.length > 0) {
    await prisma.fraudFlag.createMany({
      data: allFlags.map((f) => ({
        userId: input.user.id,
        documentId: result.doc.id,
        reason: f.reason,
        severity: f.severity,
        details: (f.details as Prisma.InputJsonValue) ?? undefined,
        autoDetected: true,
      })),
    });

    const hasHigh = allFlags.some((f) => f.severity === 'HIGH');
    if (hasHigh) {
      await prisma.user.update({
        where: { id: input.user.id },
        data: { flaggedForReview: true },
      });
    }
  }

  return {
    ok: true,
    documentId: result.doc.id,
    number: result.number,
    publicToken: result.publicToken,
    qrCodeDataUrl: result.qrCodeDataUrl,
  };
}

