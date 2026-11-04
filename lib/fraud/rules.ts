import type { DocType, Mode, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getThreshold } from './thresholds';
import { isBlacklisted } from './blacklist';
import type { FraudSeverity } from '@prisma/client';

export type FraudFlagInput = {
  reason: string;
  severity: FraudSeverity;
  details?: Record<string, unknown>;
};

export type EvaluationResult = {
  blocked: boolean;
  flags: FraudFlagInput[];
};

const MULTIPLIER_BY_AGE = (days: number): number => {
  if (days < 7) return 0.3;
  if (days < 30) return 1;
  if (days < 90) return 2;
  return 3;
};

/**
 * Évalue un document avant création. Ne bloque que sur CRITICAL.
 * Doit être appelé AVANT l'insertion en base.
 */
export async function evaluateDocument(input: {
  user: User;
  docType: DocType;
  mode: Mode;
  payload: unknown;
  totalAmountFcfa: number;
  clientId: string | null;
  contentHash: string;
}): Promise<EvaluationResult> {
  const flags: FraudFlagInput[] = [];
  let blocked = false;

  // Règle 6 : blacklist téléphone
  if (await isBlacklisted('PHONE', input.user.phone)) {
    flags.push({ reason: 'BLACKLIST_PHONE', severity: 'CRITICAL' });
    blocked = true;
  }

  // Règle 7 : blacklist taxId
  if (input.user.taxId && (await isBlacklisted('TAX_ID', input.user.taxId))) {
    flags.push({ reason: 'BLACKLIST_TAX_ID', severity: 'CRITICAL' });
    blocked = true;
  }

  // Règle 8 : blacklist hash
  if (await isBlacklisted('DOCUMENT_HASH', input.contentHash)) {
    flags.push({ reason: 'BLACKLIST_DOCUMENT_HASH', severity: 'CRITICAL' });
    blocked = true;
  }

  // Règle 5 : hash dupliqué inter-utilisateurs
  const dupOther = await prisma.document.findFirst({
    where: { contentHash: input.contentHash, userId: { not: input.user.id } },
    select: { id: true },
  });
  if (dupOther) {
    flags.push({ reason: 'HASH_DUPLICATE_OTHER_USER', severity: 'CRITICAL', details: { otherDocId: dupOther.id } });
    blocked = true;
  }

  // Règle 4 : hash dupliqué même utilisateur
  const dupSame = await prisma.document.findFirst({
    where: { contentHash: input.contentHash, userId: input.user.id },
    select: { id: true },
  });
  if (dupSame && !dupOther) {
    flags.push({ reason: 'HASH_DUPLICATE_SAME_USER', severity: 'HIGH', details: { docId: dupSame.id } });
  }

  if (blocked) return { blocked, flags };

  // Calcul du multiplicateur d'ancienneté
  const ageDays = (Date.now() - input.user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const multiplier = MULTIPLIER_BY_AGE(ageDays);

  // Règle 1 : volume anormal
  const tDocs = await getThreshold('MAX_DOCS_PER_24H');
  if (tDocs) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.document.count({
      where: { userId: input.user.id, createdAt: { gte: since } },
    });
    if (count + 1 > tDocs.value * multiplier) {
      flags.push({
        reason: 'VOLUME_ANOMALY',
        severity: 'MEDIUM',
        details: { count, threshold: tDocs.value, multiplier },
      });
    }
  }

  // Règle 2 : montant anormal
  const tAmount = await getThreshold('MAX_AMOUNT_FCFA');
  if (tAmount && input.totalAmountFcfa > tAmount.value * multiplier) {
    flags.push({
      reason: 'AMOUNT_ANOMALY',
      severity: 'MEDIUM',
      details: { amount: input.totalAmountFcfa, threshold: tAmount.value, multiplier },
    });
  }

  // Règle 3 : concentration client
  if (input.clientId) {
    const tClient = await getThreshold('MAX_DOCS_PER_CLIENT_24H');
    if (tClient) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await prisma.document.count({
        where: { userId: input.user.id, clientId: input.clientId, createdAt: { gte: since } },
      });
      if (count + 1 > tClient.value) {
        flags.push({
          reason: 'CLIENT_CONCENTRATION',
          severity: 'LOW',
          details: { count, threshold: tClient.value },
        });
      }
    }
  }

  // Règle 9 : compte récent + montant élevé
  const tNew = await getThreshold('NEW_ACCOUNT_DAYS');
  const tHigh = await getThreshold('HIGH_AMOUNT_THRESHOLD_FCFA');
  if (tNew && tHigh && ageDays < tNew.value && input.totalAmountFcfa > tHigh.value) {
    flags.push({
      reason: 'NEW_ACCOUNT_HIGH_AMOUNT',
      severity: 'HIGH',
      details: { ageDays, amount: input.totalAmountFcfa, threshold: tHigh.value },
    });
  }

  // Règle 10 : champs fiscaux manquants + montant élevé
  const tFields = await getThreshold('FRAUD_FIELDS_THRESHOLD_FCFA');
  if (
    tFields &&
    input.totalAmountFcfa > tFields.value &&
    (!input.user.taxId || !input.user.rccm)
  ) {
    flags.push({
      reason: 'MISSING_FISCAL_FIELDS',
      severity: 'MEDIUM',
      details: { amount: input.totalAmountFcfa, threshold: tFields.value },
    });
  }

  // Règle 11 : rafale (>20 documents en <60s)
  const sinceBurst = new Date(Date.now() - 60 * 1000);
  const burstCount = await prisma.document.count({
    where: { userId: input.user.id, createdAt: { gte: sinceBurst } },
  });
  if (burstCount >= 20) {
    flags.push({
      reason: 'BURST_DETECTED',
      severity: 'HIGH',
      details: { count: burstCount },
    });
  }

  return { blocked: false, flags };
}

/**
 * Détecte les montants ronds répétés. À appeler après création du document,
 * en vérifiant les 5 derniers documents de l'utilisateur.
 * Retourne un flag à ajouter si applicable.
 */
export async function detectRepeatedRoundAmounts(
  userId: string
): Promise<FraudFlagInput | null> {
  const last5 = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { payload: true },
  });
  if (last5.length < 5) return null;

  const amounts = last5.map((d) => {
    const p = d.payload as { total?: number } | null;
    return typeof p?.total === 'number' ? p.total : null;
  });
  if (amounts.some((a) => a === null)) return null;

  const allSame = amounts.every((a) => a === amounts[0]);
  const isRound = amounts[0]! % 100_000 === 0 && amounts[0]! > 0;

  if (allSame && isRound) {
    return {
      reason: 'REPEATED_ROUND_AMOUNTS',
      severity: 'MEDIUM',
      details: { amount: amounts[0] },
    };
  }
  return null;
}

