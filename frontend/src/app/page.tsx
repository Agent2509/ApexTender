"use client";

import { useRouter } from "next/navigation";
import { Mountain, ShieldCheck, Zap, Download, ArrowRight, Activity, Terminal } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 md:px-10 bg-zinc-950 relative z-10">
        <div className="flex items-center gap-2">
          <Mountain className="w-6 h-6 text-emerald-500" />
          <span className="text-xl font-black text-white tracking-tight">
            ApexTender
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/dashboard">
            <button className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white px-4 py-2 text-sm font-bold rounded-xl transition">
              Go to Workspace
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 relative z-10 max-w-5xl mx-auto">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            V2 Production Launch
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight max-w-3xl leading-tight">
          Win More Bids with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">AI RAG Analysis</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          ApexTender is the ultimate RAG engine for Request for Proposals. Ingest PDFs, search with semantic AI context, and auto-export formatted Word proposal documents.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/dashboard">
            <button className="bg-white hover:bg-zinc-200 text-zinc-950 px-8 py-4 font-black rounded-xl text-md transition-all shadow-lg shadow-white/5 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/pricing">
            <button className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white px-8 py-4 font-bold rounded-xl text-md transition">
              View Pricing
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="mt-28 md:mt-40 w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Card 1 */}
          <div className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl p-6 transition backdrop-blur-sm">
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl w-fit text-emerald-500 mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Semantic RAG Engine</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Retrieve exact vector chunks from your RFPs. Context-based answers generated using Groq and LLaMA 3.3.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl p-6 transition backdrop-blur-sm">
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl w-fit text-blue-500 mb-5">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Word Document Export</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Export completed AI analyses into beautifully formatted Word (.docx) files with one click.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl p-6 transition backdrop-blur-sm">
            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl w-fit text-purple-500 mb-5">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Developer God Mode</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Hidden administrator backdoor bypass triggers unlimited assets and an embedded live debug logs terminal.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600 bg-zinc-950 relative z-10">
        <p>© 2026 ApexTender Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}