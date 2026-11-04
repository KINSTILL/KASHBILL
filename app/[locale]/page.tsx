import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (current) {
    redirect(`/${locale}/dashboard` as Route);
  } else {
    redirect(`/${locale}/login` as Route);
  }
}

