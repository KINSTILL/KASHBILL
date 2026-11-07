import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { sendSubscriptionInvoiceEmail } from '@/lib/subscriptions/send-invoice-email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAdmin(req, 'resend_invoice_email', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const invoice = await prisma.subscriptionInvoice.findUnique({ where: { id }, include: { user: true } });
      if (!invoice) return jsonError('NOT_FOUND', 'Facture introuvable', 404);
      if (!invoice.user.email) return jsonError('VALIDATION_ERROR', 'Utilisateur sans email', 422);

      // Force re-send (clear sentByEmailAt)
      await prisma.subscriptionInvoice.update({ where: { id }, data: { sentByEmailAt: null } });

      const result = await sendSubscriptionInvoiceEmail(id);

      if (!result.ok) {
        if (result.reason === 'DISABLED') return jsonError('FORBIDDEN', 'Envoi email désactivé (RESEND_ENABLED=false)', 403);
        return jsonError('INTERNAL', `Erreur envoi email : ${result.reason}`, 500);
      }

      await writeAudit({
        actorId: admin.id,
        targetId: invoice.userId,
        action: 'admin_invoice_email_resent',
        meta: { invoiceId: id, to: invoice.user.email },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, sentTo: invoice.user.email });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

