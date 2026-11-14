import { prisma } from '@/lib/db';
import { isCustomWhatsAppActive } from '@/lib/addons/queries';
import { fetchEvolutionInstances, normalizeWhatsAppNumber, personalInstanceName } from '@/lib/whatsapp/send';

/**
 * Connexion du numéro WhatsApp personnel (add-on CUSTOM_WHATSAPP) via Evolution API.
 * L'instance est dédiée à l'utilisateur (`user_<id>`). Le numéro est affiché pour
 * vérification, la liaison se fait en scannant le QR code depuis WhatsApp.
 */

export type PersonalStatus = 'NOT_CONFIGURED' | 'NOT_CREATED' | 'PENDING' | 'CONNECTED';

function evolution(): { url: string; key: string } | null {
  const url = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
  const key = (process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY)?.trim();
  return url && key ? { url, key } : null;
}

export async function getPersonalStatus(userId: string): Promise<{ status: PersonalStatus; number: string | null; hasAddOn: boolean }> {
  const hasAddOn = await isCustomWhatsAppActive(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { personalWhatsAppNumber: true } });
  const cfg = evolution();
  if (!cfg) return { status: 'NOT_CONFIGURED', number: user?.personalWhatsAppNumber ?? null, hasAddOn };

  const instances = await fetchEvolutionInstances(cfg.url, cfg.key);
  const inst = instances.find((i) => i.name === personalInstanceName(userId));
  let status: PersonalStatus = 'NOT_CREATED';
  if (inst) status = inst.status === 'open' ? 'CONNECTED' : 'PENDING';
  return { status, number: user?.personalWhatsAppNumber ?? null, hasAddOn };
}

/**
 * Crée (ou relance) l'instance personnelle et renvoie le QR code à scanner.
 * Retourne null si Evolution n'est pas configuré ou si la réponse ne contient pas de QR.
 */
export async function startPersonalConnection(
  userId: string,
  rawPhone: string
): Promise<{ ok: true; qrBase64: string | null; pairingCode: string | null; status: PersonalStatus } | { ok: false; reason: 'NOT_CONFIGURED' | 'INVALID_NUMBER' | 'GATEWAY_ERROR' }> {
  const cfg = evolution();
  if (!cfg) return { ok: false, reason: 'NOT_CONFIGURED' };

  const number = normalizeWhatsAppNumber(rawPhone);
  if (!number) return { ok: false, reason: 'INVALID_NUMBER' };

  await prisma.user.update({ where: { id: userId }, data: { personalWhatsAppNumber: `+${number}` } });

  const name = personalInstanceName(userId);
  const instances = await fetchEvolutionInstances(cfg.url, cfg.key);
  const exists = instances.some((i) => i.name === name);

  const headers = { 'Content-Type': 'application/json', apikey: cfg.key };
  let res: Response;
  if (!exists) {
    res = await fetch(`${cfg.url}/instance/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ instanceName: name, integration: 'WHATSAPP-BAILEYS', qrcode: true, number }),
    });
  } else {
    res = await fetch(`${cfg.url}/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
  }
  if (!res.ok) return { ok: false, reason: 'GATEWAY_ERROR' };

  const data = (await res.json().catch(() => ({}))) as {
    base64?: string;
    qrcode?: { base64?: string; pairingCode?: string; code?: string };
    pairingCode?: string;
    code?: string;
  };
  const qrBase64 = data.qrcode?.base64 ?? data.base64 ?? null;
  const pairingCode = data.pairingCode ?? data.code ?? data.qrcode?.pairingCode ?? data.qrcode?.code ?? null;
  return { ok: true, qrBase64, pairingCode, status: 'PENDING' };
}
