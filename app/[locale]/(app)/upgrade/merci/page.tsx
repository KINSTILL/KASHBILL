import { AddOnThanks } from './AddOnThanks';

export default async function AddOnThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ addon?: string }>;
}) {
  const { locale } = await params;
  const { addon } = await searchParams;
  return <AddOnThanks locale={locale} subscriptionId={addon ?? null} />;
}
