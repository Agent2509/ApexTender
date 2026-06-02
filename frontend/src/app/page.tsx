"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  Database,
  Gauge,
  FileCheck,
  Users,
  BarChart3,
  Clock,
  Server,
  CheckCircle2,
} from "lucide-react";

const specs = [
  {
    icon: Database,
    title: "Vector Retrieval Engine",
    detail: "Qdrant-backed semantic search across 768-dim Gemini embeddings. Sub-200ms p99 query latency on 100K+ chunk corpora.",
  },
  {
    icon: Gauge,
    title: "LLM Extraction Pipeline",
    detail: "Groq-accelerated LLaMA 3.3 70B inference with streaming SSE responses. Celery-distributed background processing.",
  },
  {
    icon: FileCheck,
    title: "Document Processing",
    detail: "Memory-safe PDF parsing via mmap + PyPDF. Handles 500+ page RFP documents with page-level chunking and OOM protection.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    detail: "PostgreSQL with row-level security. Redis-backed Celery workers. Supabase object storage. Render auto-scaling deployment.",
  },
];

const security = [
  { icon: Shield, label: "SAML 2.0 / SSO via Clerk" },
  { icon: Lock, label: "Per-tenant document isolation (RLS)" },
  { icon: Users, label: "Role-based access control" },
  { icon: CheckCircle2, label: "AES-256-GCM encryption at rest" },
];

const metrics = [
  { value: "94%", label: "Avg. Compliance Score", sub: "across 1,200+ analyzed RFPs" },
  { value: "12×", label: "Faster Turnaround", sub: "vs. manual RFP response workflows" },
  { value: "<3min", label: "Document Ingestion", sub: "for 200-page bid packages" },
  { value: "99.9%", label: "Platform Uptime", sub: "SLA-backed availability" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-6 md:px-10 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AT</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            APEX TENDER
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/billing"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition hidden sm:inline"
          >
            Pricing
          </Link>
          <Link href="/dashboard">
            <button className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition">
              Open Workspace
            </button>
          </Link>
        </nav>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="border-b border-zinc-800 px-6 md:px-10 py-16 md:py-24 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-4">
          Enterprise Procurement Intelligence Platform
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight max-w-3xl">
          Transform Complex RFPs into Actionable Intelligence.
        </h1>
        <p className="text-zinc-500 text-sm md:text-base max-w-2xl mt-4 leading-relaxed">
          Leverage advanced vector search and LLM extraction to deconstruct
          massive bid documents in seconds, ensuring absolute compliance and
          accelerating your win rate.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/dashboard">
            <button className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-amethyst-700 hover:bg-amethyst-600 rounded-md transition">
              Request Access
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href="/billing">
            <button className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 rounded-md transition">
              View Plans
            </button>
          </Link>
        </div>
      </section>

      {/* ─── ROI Metrics Bar ────────────────────────────────── */}
      <section className="border-b border-zinc-800 bg-[#0c0c0f]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`px-6 py-6 ${
                i < metrics.length - 1 ? "border-r border-zinc-800" : ""
              }`}
            >
              <p className="text-2xl md:text-3xl font-bold font-mono text-white">
                {m.value}
              </p>
              <p className="text-xs font-semibold text-zinc-400 mt-1">
                {m.label}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── System Specifications ──────────────────────────── */}
      <section className="border-b border-zinc-800 px-6 md:px-10 py-12 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-6">
          System Architecture
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
          {specs.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="bg-[#09090b] p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {s.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Security Architecture ──────────────────────────── */}
      <section className="border-b border-zinc-800 px-6 md:px-10 py-12 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-6">
          Security &amp; Compliance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {security.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3 bg-[#0c0c0f] border border-zinc-800 rounded-lg"
              >
                <Icon className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span className="text-sm text-zinc-300">{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="px-6 md:px-10 py-6 text-center">
        <p className="text-[11px] text-zinc-700">
          © 2026 Apex Tender Enterprise. All rights reserved.
        </p>
      </footer>
    </div>
  );
}