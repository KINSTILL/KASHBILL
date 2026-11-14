import type { NextRequest } from 'next/server';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import {
  fetchEvolutionInstances,
  getEvolutionConnectionState,
  restartEvolutionInstance,
  personalInstanceName,
} from '@/lib/whatsapp/send';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, ip, userAgent }) => {
      const evolutionUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
      const evolutionKey = (
        process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY
      )?.trim();
      const configuredInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();

      if (!evolutionUrl || !evolutionKey) {
        return jsonError(
          'GATEWAY_ERROR',
          'Evolution API non configurée sur le serveur (variables manquantes).',
          500
        );
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPPORT';
      let body: { instanceName?: string } = {};
      try {
        body = await req.json();
      } catch {}

      let targetInstance = body.instanceName?.trim();

      if (!isAdmin) {
        // Utilisateur standard : restreint à sa propre instance personnelle
        targetInstance = personalInstanceName(user.id);
      } else if (!targetInstance) {
        // Admin : si aucune instance spécifiée, cibler l'instance partagée configurée
        if (configuredInstance) {
          targetInstance = configuredInstance;
        } else {
          // Sinon chercher la première instance active
          const instances = await fetchEvolutionInstances(evolutionUrl, evolutionKey);
          const openInst = instances.find((i) => i.status === 'open');
          targetInstance = openInst?.name ?? instances[0]?.name;
        }
      }

      if (!targetInstance) {
        return jsonError(
          'NOT_FOUND',
          'Aucune instance Evolution API trouvée ou configurée.',
          404
        );
      }

      // 1. Relance de l'instance via Evolution API
      const restartOk = await restartEvolutionInstance(
        evolutionUrl,
        evolutionKey,
        targetInstance
      );

      // 2. Pause courte pour laisser le socket Baileys se réinitialiser
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Tentative de reconnexion / synchronisation des contacts
      try {
        await fetch(
          `${evolutionUrl}/instance/connect/${encodeURIComponent(targetInstance)}`,
          {
            method: 'GET',
            headers: { apikey: evolutionKey },
            cache: 'no-store',
          }
        ).catch(() => {});
      } catch {}

      // 4. Vérification de l'état final de la connexion
      const state = await getEvolutionConnectionState(
        evolutionUrl,
        evolutionKey,
        targetInstance
      );

      if (isAdmin) {
        await writeAudit({
          actorId: user.id,
          targetId: user.id,
          action: 'admin_whatsapp_instance_refreshed',
          meta: { instance: targetInstance, restartOk, state },
          ip,
          userAgent,
        });
      }

      return jsonOk({
        ok: true,
        instance: targetInstance,
        state,
        restartOk,
        message:
          state === 'open'
            ? `Instance WhatsApp « ${targetInstance} » actualisée et reconnectée avec succès ! Les nouveaux numéros sont désormais reconnus.`
            : `Instance WhatsApp « ${targetInstance} » redémarrée (état : ${state}).`,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
