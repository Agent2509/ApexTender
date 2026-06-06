"use client";

import { DashboardNav } from "@/components/dashboard-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardNav>{children}</DashboardNav>;
}
