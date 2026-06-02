"use client";

import Link from "next/link";
import { ArrowRight, Zap, FileSearch, Download } from "lucide-react";
import PerspectiveGrid from "@/components/landing/PerspectiveGrid";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 3D Perspective Grid */}
      <PerspectiveGrid />

      {/* Mesh gradient blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-800/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="text-lg font-bold tracking-tighter">APEX TENDER</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/billing" className="text-sm text-zinc-400 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/dashboard">
            <button className="glass-card px-5 py-2 text-sm font-bold hover:bg-white/10 transition">
              Go to Workspace
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 md:pt-32 md:pb-40 max-w-5xl mx-auto">
        {/* Release pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-card rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
            V3 Architect Edition
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl">
          Win More Bids with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-purple-300">
            AI RAG Analysis
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mt-8 leading-relaxed">
          The ultimate enterprise RAG engine for Request for Proposals. Ingest PDFs, search with semantic AI, and auto-export formatted proposals.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/dashboard">
            <button className="group bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-8 py-4 font-bold rounded-xl text-md transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href="/billing">
            <button className="glass-card px-8 py-4 font-bold rounded-xl text-md hover:bg-white/10 transition">
              View Plans
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass-card glass-card-hover purple-radial-glow p-6">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit text-purple-400 mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Semantic RAG Engine</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Retrieve exact vector chunks from your RFPs. Context-based answers powered by Groq and LLaMA 3.3.
            </p>
          </div>

          <div className="glass-card glass-card-hover purple-radial-glow p-6">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit text-purple-400 mb-5">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Intelligent Extraction</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              AI-powered document extraction with page-level chunking and Gemini embeddings for precision retrieval.
            </p>
          </div>

          <div className="glass-card glass-card-hover purple-radial-glow p-6">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit text-purple-400 mb-5">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Word Document Export</h3>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Export AI analyses into formatted Word (.docx) files with one click. Professionally branded exports.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        <p>© 2026 Apex Tender Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}