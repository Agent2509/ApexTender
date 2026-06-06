import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard-nav";

export const metadata: Metadata = {
  title: "Dashboard — Procurement Workspace | Apex Tender",
  description:
    "Manage your RFP projects, track compliance scores, and monitor document processing from your Apex Tender dashboard.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardNav>{children}</DashboardNav>;
}
