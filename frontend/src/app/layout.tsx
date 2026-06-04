import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "APEX TENDER | Enterprise RFP Intelligence Platform",
    template: "%s | Apex Tender",
  },
  description:
    "AI-powered enterprise RFP response platform. Ingest documents, query with RAG, and export professional bid proposals in seconds.",
  openGraph: {
    title: "APEX TENDER | Enterprise RFP Intelligence Platform",
    description:
      "Transform complex RFPs into actionable intelligence with AI-powered vector search and LLM extraction.",
    url: "https://apextender.io",
    siteName: "Apex Tender",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apex Tender — Enterprise RFP Intelligence Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "APEX TENDER | Enterprise RFP Intelligence Platform",
    description:
      "Transform complex RFPs into actionable intelligence with AI-powered vector search and LLM extraction.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://apextender.io"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-black text-white`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
