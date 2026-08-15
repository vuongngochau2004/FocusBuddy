'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-[260px] flex flex-col">
        <div className="p-4 lg:p-6 flex flex-col gap-6 flex-1">
          <TopBar />
          {children}
        </div>
      </main>
    </div>
  );
}
