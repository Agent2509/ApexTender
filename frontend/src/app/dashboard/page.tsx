"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import {
  Folder,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  Activity,
  FileText,
  Cpu,
  BarChart3,
  Search,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Project {
  id: string;
  name: string;
  description?: string;
}

/* ─── Mock compliance data for the data table ───────────────────── */
const MOCK_BIDS = [
  { bidId: "RFP-2026-0041", client: "Dept. of Defense", value: 4500000, compliance: 97, status: "Awarded" },
  { bidId: "RFP-2026-0039", client: "City of Austin", value: 1200000, compliance: 88, status: "Under Review" },
  { bidId: "RFP-2026-0037", client: "NHS England", value: 3100000, compliance: 91, status: "Submitted" },
  { bidId: "RFP-2026-0035", client: "NEOM Corp.", value: 45000000, compliance: 94, status: "Awarded" },
  { bidId: "RFP-2026-0033", client: "Transport for London", value: 780000, compliance: 72, status: "Draft" },
  { bidId: "RFP-2026-0031", client: "Saudi Aramco", value: 12500000, compliance: 85, status: "Under Review" },
  { bidId: "RFP-2026-0029", client: "Port Authority NY/NJ", value: 2300000, compliance: 79, status: "Submitted" },
  { bidId: "RFP-2026-0027", client: "Ontario Infrastructure", value: 6700000, compliance: 96, status: "Awarded" },
];

const statusColors: Record<string, string> = {
  Awarded: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Submitted: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Under Review": "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Draft: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

function formatUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
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

  /* ── Table filters ──────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredBids = useMemo(() => {
    return MOCK_BIDS.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.bidId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

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
        setProjects((prev) => [...prev, data]);
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
    if (!confirm("Delete this project and all associated documents?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects/${id}`, { method: "DELETE", headers });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        {/* ─── Header Row ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-zinc-600 mt-0.5">Procurement workspace overview</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amethyst-700 hover:bg-amethyst-600 rounded-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>

        {/* ─── Compact Metrics Bar ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-zinc-800 rounded-lg overflow-hidden bg-[#0c0c0f]">
          {[
            { label: "Active Bids", value: projects.length, icon: Activity },
            {
              label: "Extraction Progress",
              value: `${projects.length > 0 ? Math.round((totalDocs / Math.max(projects.length * 3, 1)) * 100) : 0}%`,
              icon: BarChart3,
            },
            { label: "Documents Processed", value: totalDocs, icon: FileText },
            { label: "AI Tokens Used", value: (totalDocs * 1250).toLocaleString(), icon: Cpu },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`px-4 py-3 flex items-center gap-3 ${
                  i < 3 ? "border-r border-zinc-800" : ""
                }`}
              >
                <Icon className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold font-mono text-white leading-none">
                    {m.value}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{m.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── RFP Compliance Data Table ────────────────────── */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {/* Filter toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0c0c0f] border-b border-zinc-800">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search RFPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 text-sm text-zinc-300 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-[#09090b] border border-zinc-800 text-xs text-zinc-400 rounded-md pl-3 pr-7 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option>All</option>
                <option>Awarded</option>
                <option>Submitted</option>
                <option>Under Review</option>
                <option>Draft</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>
            <span className="text-[11px] text-zinc-600 ml-auto hidden sm:inline">
              {filteredBids.length} result{filteredBids.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#0c0c0f]">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Bid ID
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Source Client
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 text-right">
                    Value (USD)
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 text-right">
                    Compliance
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.map((bid) => (
                  <tr
                    key={bid.bidId}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-zinc-300">
                      {bid.bidId}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {bid.client}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-zinc-300 text-right">
                      {formatUSD(bid.value)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`text-xs font-mono font-semibold ${
                          bid.compliance >= 90
                            ? "text-emerald-400"
                            : bid.compliance >= 80
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {bid.compliance}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          statusColors[bid.status] || "text-zinc-400"
                        }`}
                      >
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="p-1 text-zinc-600 hover:text-zinc-300 transition">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBids.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-600">
                      No matching RFPs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Projects Grid ────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Projects</h2>
            <span className="text-[11px] text-zinc-600">{projects.length} total</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer-skeleton h-14 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-zinc-800 rounded-lg px-6 py-10 flex flex-col items-center text-center">
              <Folder className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-white">No projects</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                Create a project to start ingesting RFP documents.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/50">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-amethyst-400 transition-colors">
                      {project.name}
                    </p>
                    <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono text-zinc-700">
                      {project.id.slice(0, 8)}
                    </span>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Project Modal ───────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-white">Create Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-600 hover:text-white transition text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apollo RFP"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#0c0c0f] border border-zinc-800 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Brief description..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#0c0c0f] border border-zinc-800 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-zinc-600 min-h-[80px] resize-none placeholder:text-zinc-700"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-500 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-amethyst-700 hover:bg-amethyst-600 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {isCreatingProject && <Loader2 className="w-3 h-3 animate-spin" />}
                {isCreatingProject ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
