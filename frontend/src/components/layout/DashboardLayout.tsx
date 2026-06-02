"use client";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Mesh gradient background */}
        <div className="mesh-gradient-bg" />

        {/* Content – pt-14 on mobile compensates for the fixed top bar */}
        <div className="relative z-10 pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
