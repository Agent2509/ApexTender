"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Check, Zap, Sparkles, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";

export default function BillingPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [isPro, setIsPro] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" };
  };

  // Fetch billing status
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchStatus = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API}/api/v1/billing/status`, { headers });
        if (res.ok) {
          const data = await res.json();
          setIsPro(data.is_pro);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();
  }, [isLoaded, isSignedIn]);

  const couponValid = couponCode.trim().length > 0;

  const handleActivatePro = async () => {
    setIsActivating(true);
    setActivationMessage("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/billing/activate-pro`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: couponCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPro(true);
        setShowCelebration(true);
        setActivationMessage("🎉 Pro access activated successfully!");
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        setActivationMessage(data.detail || "Activation failed.");
      }
    } catch (e) {
      setActivationMessage("Network error. Please try again.");
    } finally {
      setIsActivating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black text-white tracking-tight">Plans & Billing</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Choose the right plan for your RFP pipeline.
          </p>
        </div>

        {/* Celebration overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <GlassCard className="p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-zinc-500 text-sm mb-6">Evaluate the platform.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white font-mono">$0</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Max 2 projects
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Max 3 docs per project
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Standard AI query speed
                </li>
              </ul>
            </div>
            <button
              disabled
              className="w-full py-3 px-4 font-bold rounded-xl bg-white/5 text-zinc-500 border border-white/10 cursor-default"
            >
              {isPro ? "Previous Plan" : "Current Plan"}
            </button>
          </GlassCard>

          {/* Pro Plan */}
          <div className="relative">
            {/* Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-purple-500/20">
              <Zap className="w-3 h-3" />
              {isPro ? "Active" : "Recommended"}
            </div>
            <GlassCard
              glowOnHover
              className={`p-8 flex flex-col justify-between ${
                isPro ? "border-purple-500/30" : ""
              }`}
            >
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-2">ApexTender Pro</h3>
                <p className="text-zinc-500 text-sm mb-6">For winning enterprise teams.</p>
                <div className="mb-6 relative">
                  <span
                    className={`text-4xl font-black font-mono transition-all duration-500 ${
                      couponValid ? "text-green-400" : "text-white"
                    }`}
                  >
                    {couponValid ? "$0" : "$5"}
                  </span>
                  <span className="text-zinc-500">/month</span>
                  {couponValid && (
                    <span className="ml-3 text-sm text-green-400 font-bold animate-pulse">
                      Coupon Applied!
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    Unlimited document uploads
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    Priority processing
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    Word Document auto-generation
                  </li>
                </ul>

                {/* Coupon Input */}
                {!isPro && (
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className={`w-full bg-white/5 border text-white rounded-xl px-4 py-3 focus:outline-none transition text-sm font-mono placeholder:text-zinc-700 ${
                        couponValid
                          ? "border-green-500/50 focus:border-green-500"
                          : "border-white/10 focus:border-purple-500/50"
                      }`}
                    />
                  </div>
                )}

                {activationMessage && (
                  <p className={`text-sm font-bold mb-4 ${
                    activationMessage.includes("🎉") ? "text-green-400" : "text-red-400"
                  }`}>
                    {activationMessage}
                  </p>
                )}
              </div>

              {isPro ? (
                <button
                  disabled
                  className="w-full py-3 px-4 font-bold rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-default flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Pro Active
                </button>
              ) : couponValid ? (
                <button
                  onClick={handleActivatePro}
                  disabled={isActivating}
                  className="w-full py-3 px-4 font-bold rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 animate-glow-pulse"
                >
                  {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isActivating ? "Activating..." : "Activate Pro Access"}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 font-bold rounded-xl bg-white/5 text-zinc-500 border border-white/10 cursor-default"
                >
                  Enter coupon to unlock
                </button>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
