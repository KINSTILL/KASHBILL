import { prisma } from '@/lib/db';
import { isCustomWhatsAppActive } from '@/lib/addons/queries';
import {
  fetchEvolutionInstances,
  getEvolutionConnectionState,
  normalizeWhatsAppNumber,
  personalInstanceName,
} from '@/lib/whatsapp/send';
import { getCountryByCode } from '@/lib/countries/dial-codes';

/**
 * Connexion du numéro WhatsApp personnel (add-on CUSTOM_WHATSAPP) via Evolution API.
 * L'instance est dédiée à l'utilisateur (`user_<id>`). Le numéro est affiché pour
 * vérification, la liaison se fait soit par code d'association à 8 caractères
 * (priorité mobile), soit par scan du code QR (repli PC).
 */

export type PersonalStatus = 'NOT_CONFIGURED' | 'NOT_CREATED' | 'PENDING' | 'CONNECTED';

function evolution(): { url: string; key: string } | null {
  const url = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
  const key = (process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY)?.trim();
  return url && key ? { url, key } : null;
}

export async function getPersonalStatus(
  userId: string
): Promise<{ status: PersonalStatus; number: string | null; hasAddOn: boolean }> {
  const hasAddOn = await isCustomWhatsAppActive(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personalWhatsAppNumber: true, country: true },
  });
  const cfg = evolution();
  if (!cfg) return { status: 'NOT_CONFIGURED', number: user?.personalWhatsAppNumber ?? null, hasAddOn };

  const name = personalInstanceName(userId);
  const state = await getEvolutionConnectionState(cfg.url, cfg.key, name);

  let status: PersonalStatus = 'NOT_CREATED';
  if (state === 'open') {
    status = 'CONNECTED';
  } else if (state === 'connecting' || state === 'close') {
    status = 'PENDING';
  } else {
    // Vérification complémentaire sur la liste des instances globales
    const instances = await fetchEvolutionInstances(cfg.url, cfg.key);
    const inst = instances.find((i) => i.name === name);
    if (inst) {
      const isConn = ['open', 'connected'].includes(inst.status.toLowerCase().trim());
      status = isConn ? 'CONNECTED' : 'PENDING';
    }
  }

  return { status, number: user?.personalWhatsAppNumber ?? null, hasAddOn };
}

/**
 * Crée (ou relance) l'instance personnelle et renvoie le code d'association (pairing code)
 * ainsi que le code QR.
 */
export async function startPersonalConnection(
  userId: string,
  rawPhone: string
): Promise<
  | { ok: true; qrBase64: string | null; pairingCode: string | null; status: PersonalStatus }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'INVALID_NUMBER' | 'GATEWAY_ERROR'; details?: string }
> {
  const cfg = evolution();
  if (!cfg) return { ok: false, reason: 'NOT_CONFIGURED' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personalWhatsAppNumber: true, country: true },
  });
  const dialCode = user?.country ? getCountryByCode(user.country).dialCode : '+237';
  const number = normalizeWhatsAppNumber(rawPhone, dialCode);
  if (!number) return { ok: false, reason: 'INVALID_NUMBER' };

  await prisma.user.update({
    where: { id: userId },
    data: { personalWhatsAppNumber: `+${number}` },
  });

  const name = personalInstanceName(userId);
  const state = await getEvolutionConnectionState(cfg.url, cfg.key, name);

  // Si déjà connecté, on le confirme directement
  if (state === 'open') {
    return { ok: true, qrBase64: null, pairingCode: null, status: 'CONNECTED' };
  }

  const headers = { 'Content-Type': 'application/json', apikey: cfg.key };

  // 1. Si l'instance n'existe pas encore dans Evolution API, on la crée
  if (state === 'not_found') {
    try {
      await fetch(`${cfg.url}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName: name,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          number,
        }),
      });
      // Laisser le socket Baileys démarrer
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.warn('[EVOLUTION API] Note création instance:', e);
    }
  }

  // 2. Demande de code d'association (Pairing code avec le numéro normalisé)
  let connectRes = await fetch(
    `${cfg.url}/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`,
    {
      method: 'GET',
      headers: { apikey: cfg.key },
      cache: 'no-store',
    }
  );

  // Si échec (ex: socket Baileys figé), redémarrage préventif de l'instance
  if (!connectRes.ok) {
    console.warn('[EVOLUTION API] Connect failed, restarting instance:', name, connectRes.status);
    await fetch(`${cfg.url}/instance/restart/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { apikey: cfg.key },
    }).catch(() => null);

    await new Promise((r) => setTimeout(r, 1500));

    connectRes = await fetch(
      `${cfg.url}/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`,
      {
        method: 'GET',
        headers: { apikey: cfg.key },
        cache: 'no-store',
      }
    );
  }

  if (!connectRes.ok) {
    const errText = await connectRes.text().catch(() => '');
    console.error('[EVOLUTION API] Impossible de connecter l’instance:', connectRes.status, errText);
    return { ok: false, reason: 'GATEWAY_ERROR', details: errText.slice(0, 300) };
  }

  const data = (await connectRes.json().catch(() => ({}))) as Record<string, any>;

  // Extraire le code d'association (pairingCode)
  let pairingCode: string | null = null;
  const rawPairing =
    (typeof data?.pairingCode === 'string' ? data.pairingCode : null) ??
    (typeof data?.code === 'string' && data.code.length <= 12 ? data.code : null) ??
    (typeof data?.qrcode?.pairingCode === 'string' ? data.qrcode.pairingCode : null) ??
    (typeof data?.qrcode?.code === 'string' && data.qrcode.code.length <= 12 ? data.qrcode.code : null);

  if (rawPairing) {
    pairingCode = rawPairing.trim().toUpperCase();
  }

  // Extraire le code QR
  let qrBase64: string | null =
    (typeof data?.base64 === 'string' ? data.base64 : null) ??
    (typeof data?.qrcode?.base64 === 'string' ? data.qrcode.base64 : null);

  // Si aucun des deux n'est revenu, tentative de repli sans query param ?number pour avoir au moins le QR
  if (!pairingCode && !qrBase64) {
    const fbRes = await fetch(`${cfg.url}/instance/connect/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: { apikey: cfg.key },
      cache: 'no-store',
    });
    if (fbRes.ok) {
      const fbData = (await fbRes.json().catch(() => ({}))) as Record<string, any>;
      qrBase64 =
        (typeof fbData?.base64 === 'string' ? fbData.base64 : null) ??
        (typeof fbData?.qrcode?.base64 === 'string' ? fbData.qrcode.base64 : null);
      const fbPairing =
        typeof fbData?.pairingCode === 'string'
          ? fbData.pairingCode
          : typeof fbData?.qrcode?.pairingCode === 'string'
          ? fbData.qrcode.pairingCode
          : null;
      if (fbPairing) pairingCode = fbPairing.trim().toUpperCase();
    }
  }

  return { ok: true, qrBase64, pairingCode, status: 'PENDING' };
}

/**
 * Déconnecte et purge l'instance personnelle dans Evolution API.
 */
export async function disconnectPersonalWhatsApp(userId: string): Promise<{ ok: boolean }> {
  const cfg = evolution();
  const name = personalInstanceName(userId);
  if (cfg) {
    try {
      await fetch(`${cfg.url}/instance/logout/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { apikey: cfg.key },
      });
      await fetch(`${cfg.url}/instance/delete/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { apikey: cfg.key },
      });
    } catch (e) {
      console.warn('[EVOLUTION API] Note déconnexion instance:', e);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { personalWhatsAppNumber: null },
  });

  return { ok: true };
}
