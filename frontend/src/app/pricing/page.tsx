"use client";

import { Check, Mountain, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-5xl w-full flex flex-col items-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Mountain className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Unlock Enterprise Power
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Scale your RFP processing with our AI engine. Win more contracts, faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Free Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <p className="text-slate-400 text-sm mb-6">Perfect for evaluating the platform.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["5 RFP Document Uploads", "Standard AI Analysis", "Community Support", "Basic Export Options"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative flex flex-col transform hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/20">
              <Zap className="w-3 h-3" />
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-emerald-400">ApexTender Pro</h3>
            <p className="text-slate-400 text-sm mb-6">For teams serious about winning bids.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">$5</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Unlimited RFP Uploads", 
                "Advanced LLaMA 3.3 70B Analysis", 
                "Priority Email & Chat Support", 
                "Word Document Auto-Generation", 
                "Custom Prompting (Coming Soon)",
                "Team Collaboration (Coming Soon)"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
            [Dev Bypass] Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
