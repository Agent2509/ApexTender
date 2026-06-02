"use client";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
