import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/admin/roles';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();
  if (!current || !isAdmin(current.user)) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
    </div>
  );
}

