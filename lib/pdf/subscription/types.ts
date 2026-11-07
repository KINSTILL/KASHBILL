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
};

