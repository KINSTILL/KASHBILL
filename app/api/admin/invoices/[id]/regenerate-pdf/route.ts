import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { getPlatformCompany } from '@/lib/platform/company';
import { renderSubscriptionInvoicePdf } from '@/lib/pdf/subscription/render';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAdmin(req, 'regenerate_invoice_pdf', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const invoice = await prisma.subscriptionInvoice.findUnique({
        where: { id },
        include: { user: true, subscription: true },
      });
      if (!invoice) return jsonError('NOT_FOUND', 'Facture introuvable', 404);

      const company = getPlatformCompany();
      const vatRate = invoice.vatRate ? Number(invoice.vatRate) : null;

      try {
        const pdfPath = await renderSubscriptionInvoicePdf({
          invoiceId: invoice.id,
          number: invoice.number,
          user: invoice.user,
          subscription: invoice.subscription,
          company,
          amount: invoice.amountXaf,
          vatRate,
          vatAmount: invoice.vatAmountXaf,
          total: invoice.totalXaf,
          paidAt: invoice.paidAt,
        });
        await prisma.subscriptionInvoice.update({ where: { id }, data: { pdfPath } });
        await writeAudit({
          actorId: admin.id,
          targetId: invoice.userId,
          action: 'admin_invoice_pdf_regenerated',
          meta: { invoiceId: id },
          ip,
          userAgent,
        });
        return jsonOk({ ok: true, pdfPath });
      } catch {
        return jsonError('INTERNAL', 'Erreur génération PDF', 500);
      }
    });
  } catch (err) {
    return handleApiError(err);
  }
}

