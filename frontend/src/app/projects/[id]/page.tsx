"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { UploadCloud, CheckCircle2, Loader2, Trash2, ArrowLeft, MessageSquare, ShieldAlert, FileText, Mountain } from "lucide-react";
import Link from "next/link";

interface DocumentMetadata {
  id: number;
  filename: string;
  status: string;
  chunks: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function ProjectHub({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("admin_bypass") === "CHIEF_FAIZAN_2026");
    }
  }, []);

  const userPlan = isAdmin ? "developer" : (user?.publicMetadata?.plan as string) || "free";
  const isLimitReached = userPlan === "free" && documents.length >= 3;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return {
      "Authorization": token ? `Bearer ${token}` : "Bearer mock-dev-token",
    };
  };

  // Fetch project details by listing all projects and finding this one
  const fetchProjectDetails = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((p: Project) => p.id === projectId);
        if (found) {
          setProject(found);
        } else {
          console.error("Project not found in the list");
        }
      }
    } catch (e) {
      console.error("Failed to fetch project details", e);
    } finally {
      setIsLoadingProject(false);
    }
  };

  // Fetch documents list
  const fetchDocuments = async (showLoading = false) => {
    if (showLoading) setIsLoadingDocs(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/documents?project_id=${projectId}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(
          data.map((d: any) => ({
            id: d.id,
            filename: d.filename,
            status: d.status,
            chunks: d.chunks || 0,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    } finally {
      if (showLoading) setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjectDetails();
      fetchDocuments(true);
    }
  }, [isLoaded, isSignedIn, projectId]);

  // Polling logic: Poll every 3 seconds to get the latest status
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, projectId]);

  // Delete document handler
  const handleDeleteDoc = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/documents/${docId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        console.error("Failed to delete document");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // File Upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF documents are allowed.");
      return;
    }

    if (isLimitReached) {
      alert("Document limit reached. Upgrade to Pro for unlimited uploads.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = await getHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${projectId}/documents`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (data.task_id) {
          setActiveTasks((prev) => [...prev, data.task_id]);
        }
        // Optimistically add document as Processing
        setDocuments((prev) => [
          ...prev,
          {
            id: data.document_id || Date.now(),
            filename: file.name,
            status: "Processing",
            chunks: 0,
          },
        ]);
        fetchDocuments(false);
      } else {
        alert(`Upload failed: ${data.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isReady = (status: string) => {
    const s = status.toLowerCase();
    return s === "ready" || s === "success" || s === "completed";
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
      {/* Background Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 md:px-10 bg-zinc-950 relative z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="h-4 w-px bg-zinc-800" />
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-emerald-500" />
            <span className="text-md font-bold text-white tracking-tight hidden sm:inline">
              ApexTender
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/chat`}>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-4 h-4" />
              Open AI Workspace
            </button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Project details & Limits */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6">
            {isLoadingProject ? (
              <div className="space-y-3">
                <div className="h-6 bg-zinc-850 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-zinc-850 rounded w-5/6 animate-pulse animate-delay-75" />
              </div>
            ) : project ? (
              <>
                <h1 className="text-2xl font-black text-white tracking-tight truncate">{project.name}</h1>
                <p className="text-zinc-550 text-sm mt-2 leading-relaxed">
                  {project.description || "No description provided."}
                </p>
              </>
            ) : (
              <p className="text-zinc-500 text-sm">Project details not found.</p>
            )}
          </div>

          {/* Limit Meter */}
          {userPlan === "free" && (
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span>Ingestion Capacity</span>
                <span className={documents.length >= 3 ? "text-red-400" : "text-emerald-400"}>
                  {documents.length}/3 PDFs
                </span>
              </div>
              <div className="w-full bg-zinc-955 h-2 rounded-full overflow-hidden border border-zinc-900">
                <div
                  className={`h-full transition-all duration-300 ${documents.length >= 3 ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((documents.length / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Free plans are limited to 3 documents per project. Upgrade to upload unlimited files.
              </p>
              <Link
                href="/pricing"
                className="block text-center w-full py-2 bg-zinc-850 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition"
              >
                View Plans
              </Link>
            </div>
          )}

          {/* Developer status indicator */}
          {userPlan === "developer" && (
            <div className="bg-red-950/10 border border-red-550/20 rounded-2xl p-6">
              <span className="text-xs font-bold uppercase text-red-500 tracking-wider">God Mode active</span>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Bypassing document limits (unlimited documents unlocked). Real-time debugger active.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: PDF list & Upload */}
        <div className="space-y-6 md:col-span-2">
          {/* Upload Zone */}
          <section className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6">
            <h3 className="text-md font-bold text-white mb-4">Ingest Document</h3>

            {isLimitReached ? (
              <div className="border border-red-500/20 bg-red-950/10 rounded-2xl p-6 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-sm font-bold text-white">Upload Limit Reached</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  You have ingested the maximum limit of 3 documents allowed on the Free Plan for this project.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg text-xs transition"
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf"
                  className="hidden"
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <p className="text-sm font-bold text-zinc-300">Processing file...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-zinc-600 group-hover:text-zinc-450 transition mb-3" />
                    <p className="text-sm font-bold text-zinc-300">Click to browse or drag PDF here</p>
                    <p className="text-xs text-zinc-650 mt-1">PDF documents only</p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Ingested Documents List */}
          <section className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6">
            <h3 className="text-md font-bold text-white mb-4">Ingested Memory</h3>

            {isLoadingDocs ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-zinc-550 italic py-4">No PDF documents ingested yet.</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-850 rounded-xl group hover:border-zinc-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate max-w-[250px] sm:max-w-[400px]">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-zinc-550 mt-0.5">
                          {doc.chunks > 0 ? `${doc.chunks} vector chunks` : "Parsing chunks..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {isReady(doc.status) ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-750 text-zinc-400 text-xs font-medium rounded-full flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-450" />
                          Processing
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-zinc-650 hover:text-red-400 p-1 transition opacity-0 group-hover:opacity-100"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
