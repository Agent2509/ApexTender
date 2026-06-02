"use client";

import Link from "next/link";
import { ArrowRight, Upload, Layers, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const DataMonolith = dynamic(
  () => import("@/components/landing/DataMonolith"),
  { ssr: false }
);

/* ─── Animation Variants ────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Value Propositions ────────────────────────────────────────── */
const valueProps = [
  {
    icon: Upload,
    title: "Ingest & Process",
    description:
      "Rapidly ingest multi-hundred-page RFP documents with memory-safe parsing. Our pipeline handles complex formatting, tables, and appendices with zero data loss.",
  },
  {
    icon: Layers,
    title: "Semantic Deconstruction",
    description:
      "Advanced vector embeddings powered by Gemini decompose every clause, requirement, and compliance criterion into queryable semantic chunks for precision retrieval.",
  },
  {
    icon: Cpu,
    title: "Intelligent Assembly",
    description:
      "LLM-driven response generation synthesizes compliant, professionally structured bid proposals — accelerating turnaround from weeks to hours.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Layers */}
      <div className="bg-noise" />
      <div className="mesh-gradient" />

      {/* 3D Data Monolith */}
      <DataMonolith />

      {/* Mesh gradient blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-800/10 rounded-full blur-[150px] pointer-events-none" />

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="relative z-20 h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 backdrop-blur-md bg-black/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amethyst-600 to-amethyst-900 flex items-center justify-center shadow-lg shadow-amethyst-500/20">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="text-lg font-bold tracking-tighter">
            APEX TENDER
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/billing"
            className="text-sm text-zinc-400 hover:text-white transition hidden sm:inline"
          >
            Pricing
          </Link>
          <Link href="/dashboard">
            <button className="glass-card px-5 py-2 text-sm font-bold hover:bg-white/10 transition">
              Go to Workspace
            </button>
          </Link>
        </nav>
      </header>

      {/* ─── Hero Section ───────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 md:pt-32 md:pb-40 max-w-5xl mx-auto">
        {/* Release pill */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 glass-card rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amethyst-400 animate-glow-pulse" />
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
            V3 Architect Edition
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl"
        >
          Transform Complex RFPs into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amethyst-400 via-amethyst-500 to-amethyst-300">
            Actionable Intelligence
          </span>
          .
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-zinc-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-8 leading-relaxed"
        >
          Leverage advanced vector search and LLM extraction to deconstruct
          massive bid documents in seconds, ensuring absolute compliance and
          accelerating your win rate.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link href="/dashboard">
            <button className="group bg-gradient-to-r from-amethyst-700 to-amethyst-500 hover:from-amethyst-600 hover:to-amethyst-400 text-white px-8 py-4 font-bold rounded-xl text-md transition-all shadow-lg shadow-amethyst-500/20 flex items-center gap-2">
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href="/billing">
            <button className="glass-card px-8 py-4 font-bold rounded-xl text-md hover:bg-white/10 transition">
              View Plans
            </button>
          </Link>
        </motion.div>

        {/* ─── Value Props ────────────────────────────────────── */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={prop.title}
                variants={cardReveal}
                className="glass-card glass-card-hover purple-radial-glow p-6"
              >
                <div className="p-3 rounded-xl bg-amethyst-500/10 border border-amethyst-500/20 w-fit text-amethyst-400 mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">
                  {prop.title}
                </h3>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  {prop.description}
                </p>
              </motion.div>
            );
          })}
        </motion.section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        <p>© 2026 Apex Tender Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}