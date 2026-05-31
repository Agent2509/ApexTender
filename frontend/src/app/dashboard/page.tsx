"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, SignOutButton, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { Folder, Plus, Trash2, Mountain, Loader2, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("admin_bypass") === "CHIEF_FAIZAN_2026");
    }
  }, []);

  const userPlan = isAdmin ? "developer" : (user?.publicMetadata?.plan as string) || "free";
  const isLimitReached = userPlan === "free" && projects.length >= 2;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return {
      "Authorization": token ? `Bearer ${token}` : "Bearer mock-dev-token",
    };
  };

  const fetchProjects = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects();
    }
  }, [isLoaded, isSignedIn]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    if (isLimitReached) {
      alert("Project limit reached. Please upgrade to Pro for unlimited projects.");
      return;
    }
    setIsCreatingProject(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [...prev, data]);
        setNewProjectName("");
        setNewProjectDesc("");
        setIsModalOpen(false);
        // Navigate to the newly created project
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[300px] bg-zinc-800/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 md:px-10 bg-zinc-950 relative z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-black text-white tracking-tight">
              ApexTender
            </span>
          </Link>
          <span className="h-4 w-px bg-zinc-800 hidden sm:inline" />
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-black hidden sm:inline">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Plan badge */}
          <Link href="/pricing">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full hover:border-zinc-700 transition cursor-pointer">
              <span className={`w-2 h-2 rounded-full ${userPlan === "free" ? "bg-zinc-400" : userPlan === "pro" ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="text-xs font-bold capitalize text-zinc-300">
                {userPlan === "developer" ? "God Mode" : `${userPlan} Plan`}
              </span>
            </div>
          </Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 relative z-10">
        {/* Top Banner / Headline */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Projects</h1>
            <p className="text-zinc-500 mt-1">Manage your RFP proposals and vector ingestion spaces.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white hover:bg-zinc-200 text-zinc-950 px-5 py-3 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Free Tier Project Limit Alert */}
        {userPlan === "free" && (
          <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-zinc-850 rounded-lg text-zinc-400 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Free Plan Limit: {projects.length} of 2 Projects Used</p>
                <p className="text-xs text-zinc-500">Unlock unlimited projects and auto-generation tools on Pro.</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1 transition"
            >
              Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Developer God Mode Status Alert */}
        {userPlan === "developer" && (
          <div className="mb-8 p-4 bg-zinc-900/50 border border-red-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-950/20 border border-red-500/20 text-red-500 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Developer God Mode Active</p>
                <p className="text-xs text-zinc-500">Bypassing all limit checks. Real-time debug logging unlocked.</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-mono rounded">
              CHIEF_FAIZAN_2026
            </div>
          </div>
        )}

        {/* Project Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-zinc-500 mt-3">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <Folder className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-white">No projects found</h3>
            <p className="text-zinc-500 text-sm max-w-sm mt-1">
              Create your first project to start ingesting RFP documents and querying the RAG.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl transition text-sm font-bold"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between h-48 cursor-pointer transition-all duration-200 group relative"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-lg tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="text-zinc-650 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-500 text-sm mt-2 line-clamp-3 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-auto">
                  <span className="text-xs font-mono text-zinc-650">ID: {project.id.slice(0, 8)}...</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    Open Hub <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-850 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white tracking-tight">Create Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-550 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              {isLimitReached ? (
                <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-sm leading-relaxed">
                  <p className="font-bold mb-1">Project Limit Exceeded</p>
                  You are currently on the Free Plan, which limits you to 2 projects. Please upgrade your plan or delete an existing project.
                  <div className="mt-3">
                    <Link
                      href="/pricing"
                      className="inline-block px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg text-xs transition"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Project Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apollo RFP"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-700 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</label>
                    <textarea
                      placeholder="Brief description of project requirements..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-700 transition min-h-[100px] resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-zinc-850 bg-zinc-900/30 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-450 hover:text-white transition"
              >
                Cancel
              </button>
              {!isLimitReached && (
                <button
                  onClick={handleCreateProject}
                  disabled={isCreatingProject || !newProjectName.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {isCreatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isCreatingProject ? "Creating..." : "Create Project"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
