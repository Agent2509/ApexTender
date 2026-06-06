"use client";

import Link from "next/link";
import { ArrowRight, Search, FileText, UploadCloud, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
        AT
      </div>
      <span className="text-xl font-bold tracking-tight">ApexTender</span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ─── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-6xl mx-auto items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" className="mr-2">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ────────────────────────────────────── */}
        <section className="px-4 py-24 sm:px-6 sm:py-32 max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Enterprise RFP Intelligence Platform
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto">
            Automate Your Enterprise RFP Bidding with AI.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Leverage advanced vector search and LLM extraction to deconstruct massive bid documents in seconds, ensuring absolute compliance and accelerating your win rate.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12 px-8">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12 px-8">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
            <Button size="lg" variant="outline" className="text-base h-12 px-8 border-2">
              View Demo
            </Button>
          </div>
        </section>

        {/* ─── Tech Stack Strip ────────────────────────────────── */}
        <section className="border-y bg-muted/20 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60 grayscale transition-all hover:grayscale-0">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Layers className="h-6 w-6" /> Next.js
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Layers className="h-6 w-6" /> FastAPI
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Layers className="h-6 w-6" /> Qdrant
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Layers className="h-6 w-6" /> Groq
            </div>
          </div>
        </section>

        {/* ─── Feature Grid ────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to win</h2>
            <p className="mt-4 text-muted-foreground text-lg">Powerful features built for enterprise procurement teams.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 transition-all hover:border-primary/50">
              <CardHeader>
                <UploadCloud className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Auto-Ingestion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Seamlessly parse and index complex, multi-hundred page RFP PDFs with absolute precision and memory-safe processing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50">
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Smart Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Instantly find compliance requirements and project constraints using lightning-fast semantic vector search.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Export & Generate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Draft winning responses with LLM-powered content generation and export directly to professional bid formats.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary font-bold text-primary-foreground text-xs">
              AT
            </div>
            <span className="font-semibold text-sm">ApexTender</span>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition">Contact Support</Link>
            <Link href="#" className="hover:text-foreground transition">LinkedIn</Link>
          </nav>
          
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ApexTender. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}