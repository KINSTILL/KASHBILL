import { prisma } from '@/lib/db';
import type { DocType, Locale, Mode, User, Prisma } from '@prisma/client';
import { generateDocumentNumber } from './numbering';
import { computeContentHash } from './hash';
import { computePayload, type DocumentPayloadInput } from './payload';
import { evaluateDocument, detectRepeatedRoundAmounts } from '@/lib/fraud/rules';
import { generatePublicToken } from './verification';
import { generateQrCode } from './integrity';
import { env } from '@/lib/env';

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
  | { ok: false; reason: 'BLOCKED'; blockedReasons: string[]; flags: Array<{ reason: string; severity: string }> };

export async function createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult> {
  const computed = computePayload(input.payload);
  const year = new Date().getFullYear();

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
    const number = await generateDocumentNumber(tx, input.user.id, input.type, year);

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

