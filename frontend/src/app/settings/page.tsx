"use client";

import { useUser, RedirectToSignIn, UserProfile } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

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
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-zinc-500 mt-1">Manage your account and preferences.</p>
        </div>

        {/* Profile Section */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Name</label>
              <p className="text-white">{user?.fullName || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Email</label>
              <p className="text-white font-mono text-sm">{user?.primaryEmailAddress?.emailAddress || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">User ID</label>
              <p className="text-zinc-400 font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        </GlassCard>

        {/* Appearance Section */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Theme</p>
              <p className="text-xs text-zinc-500">Obsidian & Amethyst (Fixed)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-black border border-white/20" />
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-purple-400" />
            </div>
          </div>
        </GlassCard>

        {/* API Section */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">API Configuration</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Backend URL</label>
              <p className="text-zinc-400 font-mono text-xs break-all">
                {process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "Not configured"}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
