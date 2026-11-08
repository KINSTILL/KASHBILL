import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/admin/roles';

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (current) {
    if (isAdmin(current.user)) {
      redirect(`/${locale}/admin` as Route);
    }
    redirect(`/${locale}/dashboard` as Route);
  } else {
    redirect(`/${locale}/login` as Route);
  }
}

