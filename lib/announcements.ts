import { prisma } from '@/lib/db';

export type PlatformAnnouncement = {
  id: string;
  title: string;
  message: string;
  endsAt: string;
  createdAt: string;
};

type StoredAnnouncementMeta = {
  active?: boolean;
  title?: string;
  message?: string;
  endsAt?: string;
};

export const ANNOUNCEMENT_AUDIT_ACTION = 'PLATFORM_ANNOUNCEMENT';

export async function getActiveAnnouncement(): Promise<PlatformAnnouncement | null> {
  try {
    const latest = await prisma.auditLog.findFirst({
      where: { action: ANNOUNCEMENT_AUDIT_ACTION },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest || !latest.meta || typeof latest.meta !== 'object') {
      return null;
    }

    const meta = latest.meta as StoredAnnouncementMeta;
    if (!meta.active || !meta.message || !meta.endsAt) {
      return null;
    }

    const endsAtDate = new Date(meta.endsAt);
    if (Number.isNaN(endsAtDate.getTime()) || endsAtDate.getTime() <= Date.now()) {
      return null;
    }

    return {
      id: latest.id,
      title: (meta.title && meta.title.trim()) || 'Annonce MyCashBill',
      message: meta.message,
      endsAt: endsAtDate.toISOString(),
      createdAt: latest.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}
