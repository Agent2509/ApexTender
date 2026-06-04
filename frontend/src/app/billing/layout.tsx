import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Billing — Manage Your Subscription | Apex Tender",
  description:
    "Choose the right plan for your enterprise RFP pipeline. Upgrade to Apex Tender Pro for unlimited projects and priority processing.",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
