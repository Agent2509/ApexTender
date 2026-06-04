import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Flexible Plans for Any Scale | Apex Tender",
  description:
    "Compare Apex Tender plans. Start free or upgrade to Pro for unlimited projects, document uploads, and priority AI processing.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
