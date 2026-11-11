import type { Subscription, User } from '@prisma/client';
import type { PlatformCompany } from '@/lib/platform/company';

export type SubscriptionInvoicePdfInput = {
  invoiceId: string;
  number: string;
  user: User;
  subscription: Subscription;
  company: PlatformCompany;
  amount: number;
  vatRate: number | null;
  vatAmount: number | null;
  total: number;
  paidAt: Date;
  /** Facture générée en mode test par un admin : seul cas où le bandeau « démonstration » apparaît. */
  isTestMode?: boolean;
  publicToken?: string;
  qrCode?: string;
  /** Libellé de la ligne (add-on) ; par défaut « MyCashBill Pro ». */
  itemTitle?: string;
  itemDescription?: string;
};
