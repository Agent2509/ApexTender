"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Folder, Plus, Trash2, Loader2, ArrowRight, Activity, FileText, Cpu, BarChart3 } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import MetricCounter from "@/components/ui/MetricCounter";
import BentoGrid, { BentoItem } from "@/components/ui/BentoGrid";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" };
  };

  const fetchProjects = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchProjects();
  }, [isLoaded, isSignedIn]);

  // Count total documents across all projects
  useEffect(() => {
    if (!isLoaded || !isSignedIn || projects.length === 0) return;
    const fetchDocs = async () => {
      try {
        let total = 0;
        const headers = await getHeaders();
        for (const proj of projects) {
          const res = await fetch(`${API}/api/v1/documents?project_id=${proj.id}`, { headers });
          if (res.ok) {
            const docs = await res.json();
            total += docs.length;
          }
        }
        setTotalDocs(total);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, [isLoaded, isSignedIn, projects.length]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(prev => [...prev, data]);
        setNewProjectName("");
        setNewProjectDesc("");
        setIsModalOpen(false);
        router.push(`/projects/${data.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project and all its documents?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects/${id}`, { method: "DELETE", headers });
      if (res.ok) setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
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
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 mt-1">Overview of your RFP workspace.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-5 py-3 font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Bento Metrics Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
          </div>
        ) : (
          <BentoGrid>
            <BentoItem>
              <MetricCounter
                value={projects.length}
                label="Active Bids"
                icon={Activity}
                iconColor="text-purple-400"
                pulseDot
              />
            </BentoItem>
            <BentoItem>
              <MetricCounter
                value={projects.length > 0 ? Math.round((totalDocs / Math.max(projects.length * 3, 1)) * 100) : 0}
                label="Extraction Progress"
                suffix="%"
                icon={BarChart3}
                iconColor="text-purple-400"
              />
            </BentoItem>
            <BentoItem>
              <MetricCounter
                value={totalDocs}
                label="Documents Processed"
                icon={FileText}
                iconColor="text-purple-400"
              />
            </BentoItem>
            <BentoItem>
              <MetricCounter
                value={totalDocs * 1250}
                label="AI Tokens Used"
                icon={Cpu}
                iconColor="text-purple-400"
              />
            </BentoItem>
          </BentoGrid>
        )}

        {/* Projects Grid */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
          {isLoading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : projects.length === 0 ? (
            <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
              <Folder className="w-12 h-12 text-zinc-700 mb-4" />
              <h3 className="text-lg font-bold text-white">No projects found</h3>
              <p className="text-zinc-500 text-sm max-w-sm mt-1">
                Create your first project to start ingesting RFP documents.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 px-5 py-2.5 glass-card text-white hover:bg-white/10 rounded-xl transition text-sm font-bold"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <GlassCard
                  key={project.id}
                  hover3D
                  glowOnHover
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="p-6 flex flex-col justify-between h-48 group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-lg tracking-tight truncate group-hover:text-purple-400 transition-colors">
                        {project.name}
                      </h3>
                      <button
                        onClick={e => handleDeleteProject(project.id, e)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-zinc-500 text-sm mt-2 line-clamp-3 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <span className="text-xs font-mono text-zinc-600">ID: {project.id.slice(0, 8)}...</span>
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      Open Hub <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl shadow-purple-500/5">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Create Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo RFP"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition min-h-[100px] resize-none placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-white transition">Cancel</button>
              <button
                onClick={handleCreateProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {isCreatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isCreatingProject ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
