import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { DraftReminder } from '@/components/pwa/DraftReminder';
import { AdminCockpitBar } from '@/components/admin/AdminCockpitBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <AdminCockpitBar />
      <DraftReminder />
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main className="flex-1 w-full max-w-4xl px-3 sm:px-4 py-4 sm:py-6 pb-28 md:pb-6 overflow-x-hidden sm:overflow-x-visible">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

