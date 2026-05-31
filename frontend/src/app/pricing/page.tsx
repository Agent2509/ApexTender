"use client";

import { Check, Mountain, Zap, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("admin_bypass") === "CHIEF_FAIZAN_2026");
    }
  }, []);

  const userPlan = isAdmin ? "developer" : (user?.publicMetadata?.plan as string) || "free";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-200 font-sans relative overflow-hidden">
      {/* Background Gradient Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl w-full flex flex-col items-center space-y-12 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-inner">
              <Mountain className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Flexible Plans for Any Scale
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Choose the right plan to accelerate your RFP proposal pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl justify-center items-stretch">
          {/* Free Tier */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-sm transition-all duration-300 hover:border-zinc-700">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-zinc-400 text-sm mb-6">Evaluate the platform and get started.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Max 2 projects</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Max 3 docs per project</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Standard AI query speed</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full py-3 px-4 font-bold rounded-xl transition-all duration-200 ${
                userPlan === "free"
                  ? "bg-zinc-800 text-zinc-400 cursor-default"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white"
              }`}
              disabled={userPlan === "free"}
            >
              {userPlan === "free" ? "Current Plan" : "Downgrade to Free"}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-zinc-900 border-2 border-emerald-500/40 rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(16,185,129,0.1)] relative transition-all duration-300 hover:border-emerald-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-zinc-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/20">
              <Zap className="w-3 h-3 fill-zinc-950" />
              Most Popular
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-400 mb-2">ApexTender Pro</h3>
              <p className="text-zinc-400 text-sm mb-6">Designed for winning enterprise teams.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">$5</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited document uploads</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Priority processing & high speed</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Word Document auto-generation</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full py-3 px-4 font-bold rounded-xl transition-all duration-200 ${
                userPlan === "pro"
                  ? "bg-zinc-800 text-zinc-400 cursor-default"
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
              }`}
              disabled={userPlan === "pro"}
            >
              {userPlan === "pro" ? "Current Plan" : "Upgrade to Pro"}
            </button>
          </div>

          {/* Developer/God Mode Tier - Hidden/Only visible if bypass active or user has dev plan metadata */}
          {(userPlan === "developer" || userPlan === "admin") && (
            <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-sm transition-all duration-300 hover:border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.05)] relative col-span-1 md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Terminal className="w-3 h-3" />
                God Mode Active
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-500 mb-2">Developer</h3>
                <p className="text-zinc-400 text-sm mb-6">Backend backdoor & unlimited debug console.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">Bypassed</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>God Mode Enabled</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Real-time Debug logs</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Unlimited Projects & Docs</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200"
              >
                Access God Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
