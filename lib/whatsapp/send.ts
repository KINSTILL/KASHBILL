import { isCustomWhatsAppActive } from '@/lib/addons/queries';
import { COUNTRIES, getCountryByCode } from '@/lib/countries/dial-codes';

/**
 * Envoi d'un document par WhatsApp. Un seul chemin pour l'envoi simple et l'envoi en masse.
 *
 * - Mode A (par défaut) : instance MyCashBill partagée, message encadré avec l'identité de l'émetteur.
 * - Mode B (add-on « numéro personnel » ACTIF) : les messages partent UNIQUEMENT de l'instance
 *   dédiée de l'utilisateur. Si elle n'est pas connectée, l'envoi échoue : jamais de repli
 *   vers l'instance MyCashBill.
 * Si l'add-on expire, le Mode B n'est plus accessible et le Mode A s'applique.
 */

export type WhatsAppSendInput = {
  user: { id: string; phone: string; businessName: string | null; legalName: string | null; name: string | null };
  phone: string;
  message: string;
  pdf: Buffer;
  fileName: string;
  isEn: boolean;
  /**
   * Canal demandé par l'utilisateur.
   * - 'shared'   : instance MyCashBill partagée (toujours disponible).
   * - 'personal' : instance dédiée de l'utilisateur (exige l'add-on actif + connecté, sans repli).
   * - absent     : comportement historique (add-on actif → personnel, sinon partagé).
   */
  mode?: 'shared' | 'personal';
  /**
   * Code pays ISO-2 du destinataire (ex. `FR`, `CI`, `CM`), choisi par l'utilisateur.
   * Sert à résoudre l'indicatif : n'importe quel pays peut être ciblé.
   * Absent → `phone` doit déjà contenir l'indicatif, sinon Cameroun par défaut.
   */
  countryCode?: string;
  /** Fichier XML à envoyer juste après le PDF (facultatif). Son échec ne fait pas échouer l'envoi. */
  xml?: { content: string; fileName: string };
};

export type WhatsAppSendResult =
  | { ok: true; mode: 'custom' | 'shared'; xmlSent?: boolean }
  | {
      ok: false;
      reason:
        | 'NOT_CONFIGURED'
        | 'INVALID_NUMBER'
        | 'PERSONAL_NOT_CONNECTED'
        | 'NO_INSTANCE_FOUND'
        | 'GATEWAY_ERROR';
      gatewayStatus?: number;
      /** Motif technique court renvoyé par Evolution (aide au diagnostic). */
      details?: string;
    };

/** Vrai si le numéro contient déjà un indicatif international explicite (+ ou 00). */
export function hasInternationalPrefix(rawPhone: string): boolean {
  return /^\s*(\+|00)/.test(rawPhone ?? '');
}

/**
 * Indicatifs connus, triés du plus long au plus court (ex. `+971` avant `+97`,
 * `+1` après tout autre) : garantit que le préfixe le plus spécifique gagne.
 */
const DIAL_CODES_DESC: string[] = Array.from(
  new Set(COUNTRIES.map((c) => c.dialCode.replace(/\D/g, '')).filter((d) => d.length > 0))
).sort((a, b) => b.length - a.length);

/** Retrouve l'indicatif pays présent en tête d'une suite de chiffres (le plus spécifique). */
function detectDialCode(digits: string): string | null {
  for (const cc of DIAL_CODES_DESC) {
    if (digits.startsWith(cc)) return cc;
  }
  return null;
}

/** Longueur du numéro national attendue pour un indicatif donné (min/max), si connu. */
function nationalLengthBounds(cc: string): { min: number; max: number } | null {
  const match = COUNTRIES.find((c) => c.dialCode.replace(/\D/g, '') === cc);
  return match ? { min: match.minDigits, max: match.maxDigits } : null;
}

/**
 * Normalise un numéro vers le format attendu par WhatsApp/Evolution :
 * chiffres uniquement, avec indicatif pays, sans `+`, sans `00` et sans `0` initial.
 *
 * Le pays est celui choisi par l'utilisateur (`dialCode`, ex. `+237`, `+33`, `+225`) :
 * n'importe quel pays fonctionne, aucun indicatif n'est imposé.
 *
 * Le numéro n'est JAMAIS préfixé deux fois : un indicatif déjà présent est détecté
 * et respecté, même si l'utilisateur a aussi choisi un pays dans le sélecteur.
 *
 * - `+33 6 12 34 56 78`, `0033 6 12 34 56 78` → `33612345678`
 * - `06 12 34 56 78` avec `+33` → `33612345678`
 * - `+33 06…` (0 national parasite) → `336…`
 * - `2376XXXXXXXX` avec `+237` → `2376XXXXXXXX` (pas de double préfixe)
 * - `+2376XXXXXXXX` avec le sélecteur resté sur `+33` → `2376XXXXXXXX`
 * - Numéro invalide pour l'indicatif connu (longueur hors bornes) → `''`
 *
 * @param rawPhone   Numéro saisi (peut contenir +, 00, espaces, tirets, parenthèses)
 * @param dialCode   Indicatif du pays choisi, ex. `+237` (défaut `+237` pour compatibilité)
 */
export function normalizeWhatsAppNumber(rawPhone: string, dialCode = '+237'): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';

  // Indicatif du pays choisi par l'utilisateur (chiffres uniquement, ex. `+33` → `33`).
  const selected = dialCode.replace(/\D/g, '');
  const hasExplicitPrefix = /^\+|^00/.test(trimmed);

  // Chiffres bruts, sans `+` ni `00` ni séparateurs.
  const digits = trimmed.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
  if (!digits) return '';

  // 1) L'indicatif est-il déjà présent en tête ?
  //    - préfixe explicite (`+…` / `00…`) : oui par construction ;
  //    - sinon, on ne le suppose que si le préfixe détecté est assez spécifique
  //      (≥ 3 chiffres) ou s'il correspond à l'indicatif choisi et que la longueur le confirme.
  let cc: string | null = null;
  let national: string;

  if (hasExplicitPrefix) {
    cc = detectDialCode(digits);
    // Indicatif inconnu : on garde le numéro tel quel (ex. numéro satellite/régional).
    if (!cc) return digits.length >= 6 ? digits : '';
    national = digits.slice(cc.length);
  } else {
    const detected = detectDialCode(digits);
    const detectedIsSelected = detected !== null && detected === selected;
    const detectedIsSpecific = detected !== null && detected.length >= 3;
    const boundsDetected = detected ? nationalLengthBounds(detected) : null;
    const detectedFits =
      detected !== null &&
      boundsDetected !== null &&
      digits.length - detected.length >= boundsDetected.min &&
      digits.length - detected.length <= boundsDetected.max;

    if (detected && (detectedIsSelected || detectedIsSpecific || detectedFits)) {
      cc = detected;
      national = digits.slice(cc.length);
    } else if (selected) {
      // Numéro national saisi sans indicatif : on préfixe avec le pays choisi.
      cc = selected;
      national = digits;
    } else {
      // Aucun indicatif ni choix : numéro nu.
      const bare = digits.replace(/^0+/, '');
      return bare || '';
    }
  }

  const bounds = nationalLengthBounds(cc);

  // 2) `0` national résiduel juste après l'indicatif (ex. +33 06… → 336…).
  //    Attention : dans certains pays le `0` de tête fait PARTIE du numéro
  //    (ex. Côte d'Ivoire : `07 07 07 07 07` = 10 chiffres significatifs).
  //    Règle : on retire le `0` UNIQUEMENT si, en le gardant, le numéro dépasse
  //    la longueur maximale connue pour ce pays.
  if (bounds && national.length > bounds.max) {
    national = national.replace(/^0+/, '');
  } else if (!bounds) {
    national = national.replace(/^0+/, '');
  }
  if (!national) return '';

  // 3) Validation souple : on rejette uniquement si le numéro est manifestement trop court
  //    pour l'indicatif (numéro tronqué). On ne rejette pas sur un léger excédent de chiffres
  //    pour ne jamais bloquer un numéro valide atypique.
  if (bounds && national.length < bounds.min) {
    return '';
  }

  const full = `${cc}${national}`;
  // Plausibilité générale E.164 (6 à 15 chiffres au total).
  if (full.length < 6 || full.length > 15) return '';

  return full;
}

/** Construit une URL wa.me de secours avec message et lien sécurisé de téléchargement. */
export function buildWhatsAppFallbackUrl(params: {
  phone: string;
  message?: string;
  downloadUrl: string;
  xmlUrl?: string;
  docNumber?: string;
  isEn?: boolean;
}): string {
  const { phone, message, downloadUrl, xmlUrl, isEn } = params;
  const trimmed = message?.trim() || '';

  const linkSection = isEn
    ? `\n\n📄 Download document: ${downloadUrl}${xmlUrl ? `\n📂 Accounting XML file: ${xmlUrl}` : ''}`
    : `\n\n📄 Télécharger le document : ${downloadUrl}${xmlUrl ? `\n📂 Fichier XML comptable : ${xmlUrl}` : ''}`;

  const fullText = trimmed ? `${trimmed}${linkSection}` : linkSection.trim();
  const digitsOnly = phone.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(fullText)}`;
}

/** Message encadré (Mode A) : identité de l'émetteur et clause d'outil technique. */
export function buildAttributedCaption(params: {
  userMessage: string;
  senderName: string;
  senderPhone: string;
  isEn: boolean;
}): string {
  const { userMessage, senderName, senderPhone, isEn } = params;
  const trimmedMsg = userMessage.trim();
  const senderLabel =
    senderName && senderName !== senderPhone ? `${senderName} (${senderPhone})` : senderPhone;

  if (isEn) {
    const header = `📌 *Document sent on behalf of: ${senderLabel}*`;
    const footer = `_ℹ️ This document is automatically delivered via MyCashBill at the request of ${senderName || senderPhone}. MyCashBill is solely a technical invoicing tool: for any inquiry or payment, please contact the sender directly at ${senderPhone}._`;
    return trimmedMsg
      ? `${header}\n───────────────\n${trimmedMsg}\n───────────────\n${footer}`
      : `${header}\n───────────────\n${footer}`;
  }

  const header = `📌 *Document envoyé de la part de : ${senderLabel}*`;
  const footer = `_ℹ️ Ce document vous est transmis automatiquement via MyCashBill à la demande de ${senderName || senderPhone}. MyCashBill est uniquement un outil technique d'édition : pour toute question ou règlement, veuillez contacter directement l'émetteur au ${senderPhone}._`;
  return trimmedMsg
    ? `${header}\n───────────────\n${trimmedMsg}\n───────────────\n${footer}`
    : `${header}\n───────────────\n${footer}`;
}

export async function fetchEvolutionInstances(
  evolutionUrl: string,
  evolutionKey: string
): Promise<Array<{ name: string; status: string }>> {
  try {
    const res = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: evolutionKey },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        name: String(item?.name ?? item?.instance?.instanceName ?? item?.instanceName ?? ''),
        status: String(item?.connectionStatus ?? item?.instance?.status ?? item?.status ?? ''),
      }))
      .filter((i) => i.name.length > 0);
  } catch {
    return [];
  }
}

export function personalInstanceName(userId: string): string {
  return `user_${userId}`;
}

async function resolveSharedInstance(
  evolutionUrl: string,
  evolutionKey: string,
  configuredInstance?: string
): Promise<string | null> {
  if (configuredInstance) return configuredInstance;
  const instances = await fetchEvolutionInstances(evolutionUrl, evolutionKey);
  if (instances.length === 0) return null;
  const openInst = instances.find((i) => i.status === 'open');
  return openInst?.name ?? instances[0]?.name ?? null;
}

export async function restartEvolutionInstance(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string
): Promise<boolean> {
  try {
    const res = await fetch(`${evolutionUrl}/instance/restart/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { apikey: evolutionKey },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendMedia(params: {
  evolutionUrl: string;
  evolutionKey: string;
  instanceName: string;
  number: string;
  caption: string;
  cleanBase64: string;
  fileName: string;
  mimetype?: string;
  retryOnFailure?: boolean;
}): Promise<{ ok: boolean; status: number; details?: string }> {
  const { evolutionUrl, evolutionKey, instanceName, number, caption, cleanBase64, fileName, retryOnFailure = true } = params;
  const mimetype = params.mimetype ?? 'application/pdf';
  const endpoint = `${evolutionUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`;

  // 1. Format Evolution API v2 officiel (strict, sans aucun champ superflu rejeté par les validateurs)
  const v2Res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionKey },
    body: JSON.stringify({
      number,
      mediatype: 'document',
      mimetype,
      caption,
      media: cleanBase64,
      fileName,
    }),
  });
  if (v2Res.ok) return { ok: true, status: v2Res.status };

  const v2ErrText = await v2Res.text().catch(() => '');

  // 2. Format Evolution API v1 en repli (mediaMessage)
  const v1Res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionKey },
    body: JSON.stringify({
      number,
      mediaMessage: { mediatype: 'document', fileName, caption, media: cleanBase64 },
    }),
  });
  if (v1Res.ok) return { ok: true, status: v1Res.status };
  const v1ErrText = await v1Res.text().catch(() => '');

  // 3. Auto-rafraîchissement automatique d'Evolution API :
  // Si erreur réseau / socket / cache Baileys ou réponse d'inexistence suspecte,
  // on redémarre l'instance en arrière-plan, on attend 1.5s et on retente une fois l'envoi.
  if (retryOnFailure) {
    const errText = v2ErrText || v1ErrText;
    const shouldRefresh =
      v2Res.status >= 500 ||
      v1Res.status >= 500 ||
      errText.includes('exists') ||
      errText.includes('Connection Closed') ||
      errText.includes('QRcode') ||
      errText.includes('Session');

    if (shouldRefresh) {
      console.warn(`[EVOLUTION API] Tentative d'auto-rafraîchissement de l'instance ${instanceName}...`);
      await restartEvolutionInstance(evolutionUrl, evolutionKey, instanceName);
      // Attente brève que le socket de l'instance se réinitialise
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return sendMedia({
        ...params,
        retryOnFailure: false,
      });
    }
  }

  return { ok: false, status: v2Res.status || v1Res.status, details: v2ErrText || v1ErrText };
}

export async function sendDocumentViaWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const evolutionUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
  const evolutionKey = (process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY)?.trim();
  const configuredInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();
  if (!evolutionUrl || !evolutionKey) return { ok: false, reason: 'NOT_CONFIGURED' };

  // Indicatif résolu depuis le pays choisi par l'utilisateur (n'importe quel pays).
  const dialCode = input.countryCode ? getCountryByCode(input.countryCode).dialCode : undefined;
  const number = normalizeWhatsAppNumber(input.phone, dialCode);
  if (!number) return { ok: false, reason: 'INVALID_NUMBER' };

  const cleanBase64 = input.pdf.toString('base64');
  const fileName = input.fileName.endsWith('.pdf') ? input.fileName : `${input.fileName}.pdf`;

  // Mode B : numéro personnel. Exige l'add-on actif et l'instance connectée. Aucun repli possible.
  // - mode 'shared' force le Mode A (l'utilisateur a explicitement choisi MyCashBill).
  // - mode 'personal' ou absent (comportement historique) : on tente le Mode B si l'add-on est actif.
  const wantsPersonal = input.mode !== 'shared';
  if (wantsPersonal && (await isCustomWhatsAppActive(input.user.id))) {
    const name = personalInstanceName(input.user.id);
    const instances = await fetchEvolutionInstances(evolutionUrl, evolutionKey);
    const connected = instances.some((i) => i.name === name && i.status === 'open');
    if (!connected) return { ok: false, reason: 'PERSONAL_NOT_CONNECTED' };

    const res = await sendMedia({
      evolutionUrl,
      evolutionKey,
      instanceName: name,
      number,
      caption: input.message || '',
      cleanBase64,
      fileName,
    });
    if (!res.ok) {
      console.warn('[EVOLUTION API] envoi personnel en échec:', res.status, res.details?.slice(0, 300));
      return { ok: false, reason: 'GATEWAY_ERROR', gatewayStatus: res.status, details: res.details?.slice(0, 300) };
    }
    return { ok: true, mode: 'custom', xmlSent: await sendXmlAfter(input, { evolutionUrl, evolutionKey, instanceName: name, number }) };
  }

  // Mode A : instance MyCashBill partagée
  const senderName =
    input.user.businessName?.trim() || input.user.legalName?.trim() || input.user.name?.trim() || input.user.phone;
  const caption = buildAttributedCaption({
    userMessage: input.message || '',
    senderName,
    senderPhone: input.user.phone,
    isEn: input.isEn,
  });

  const target = await resolveSharedInstance(evolutionUrl, evolutionKey, configuredInstance);
  if (!target) return { ok: false, reason: 'NO_INSTANCE_FOUND' };

  let usedInstance = target;
  let res = await sendMedia({ evolutionUrl, evolutionKey, instanceName: target, number, caption, cleanBase64, fileName });
  if (!res.ok && res.status === 404 && configuredInstance) {
    const auto = await resolveSharedInstance(evolutionUrl, evolutionKey, undefined);
    if (auto && auto !== configuredInstance) {
      usedInstance = auto;
      res = await sendMedia({ evolutionUrl, evolutionKey, instanceName: auto, number, caption, cleanBase64, fileName });
    }
  }
  if (!res.ok) {
    console.warn('[EVOLUTION API] envoi partagé en échec:', res.status, res.details?.slice(0, 300));
    return { ok: false, reason: 'GATEWAY_ERROR', gatewayStatus: res.status, details: res.details?.slice(0, 300) };
  }
  const usedFinal = usedInstance;
  return {
    ok: true,
    mode: 'shared',
    xmlSent: await sendXmlAfter(input, { evolutionUrl, evolutionKey, instanceName: usedFinal, number }),
  };
}

/** Envoie le fichier XML (si demandé) sur la même instance et vers le même numéro. */
async function sendXmlAfter(
  input: WhatsAppSendInput,
  ctx: { evolutionUrl: string; evolutionKey: string; instanceName: string; number: string }
): Promise<boolean | undefined> {
  if (!input.xml) return undefined;
  try {
    const r = await sendMedia({
      ...ctx,
      caption: '',
      cleanBase64: Buffer.from(input.xml.content, 'utf-8').toString('base64'),
      fileName: input.xml.fileName.endsWith('.xml') ? input.xml.fileName : `${input.xml.fileName}.xml`,
      mimetype: 'application/xml',
    });
    return r.ok;
  } catch {
    return false;
  }
}
