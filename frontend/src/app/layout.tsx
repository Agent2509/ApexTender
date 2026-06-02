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
  title: "APEX TENDER | Enterprise RFP Engine",
  description:
    "AI-powered enterprise RFP response platform. Ingest documents, query with RAG, and export professional bid proposals.",
  keywords: ["RFP", "proposal", "AI", "RAG", "enterprise", "bid management"],
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
