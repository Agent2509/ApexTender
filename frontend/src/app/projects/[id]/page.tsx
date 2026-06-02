"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { UploadCloud, CheckCircle2, Loader2, Trash2, MessageSquare, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

interface DocumentMeta {
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
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" };
  };

  const fetchProjectDetails = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects`, { headers });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((p: Project) => p.id === projectId);
        if (found) setProject(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const fetchDocuments = async (showLoading = false) => {
    if (showLoading) setIsLoadingDocs(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/documents?project_id=${projectId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.map((d: any) => ({ id: d.id, filename: d.filename, status: d.status, chunks: d.chunks || 0 })));
      }
    } catch (e) {
      console.error(e);
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

  // Polling every 3s
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const interval = setInterval(() => fetchDocuments(false), 3000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, projectId]);

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/documents/${docId}`, { method: "DELETE", headers });
      if (res.ok) setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Only PDF documents."); return; }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects/${projectId}/documents`, { method: "POST", headers, body: formData });
      const data = await res.json();
      if (res.ok) {
        setDocuments(prev => [...prev, { id: data.document_id || Date.now(), filename: file.name, status: "Processing", chunks: 0 }]);
        fetchDocuments(false);
      } else {
        alert(`Upload failed: ${data.detail || "Unknown error"}`);
      }
    } catch (e) {
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isReady = (status: string) => ["ready", "success", "completed"].includes(status.toLowerCase());

  if (!isLoaded) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  }
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {isLoadingProject ? (
              <SkeletonLoader variant="text" count={2} />
            ) : project ? (
              <>
                <h1 className="text-2xl font-black text-white tracking-tight">{project.name}</h1>
                <p className="text-zinc-500 text-sm mt-1">{project.description || "No description."}</p>
              </>
            ) : (
              <p className="text-zinc-500">Project not found.</p>
            )}
          </div>
          <Link href={`/projects/${projectId}/chat`}>
            <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-5 py-2.5 font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-purple-500/20">
              <MessageSquare className="w-4 h-4" />
              AI Workspace
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Zone */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-white mb-4">Ingest Document</h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/10 hover:border-purple-500/30 hover:bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                {isUploading ? (
                  <><Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" /><p className="text-sm text-zinc-300">Processing...</p></>
                ) : (
                  <><UploadCloud className="w-8 h-8 text-zinc-600 group-hover:text-purple-400 transition mb-3" /><p className="text-sm text-zinc-300">Click to upload PDF</p><p className="text-xs text-zinc-600 mt-1">PDF documents only</p></>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-white mb-4">Ingested Memory</h3>
              {isLoadingDocs ? (
                <SkeletonLoader variant="table-row" count={3} />
              ) : documents.length === 0 ? (
                <p className="text-sm text-zinc-500 italic py-4">No documents ingested yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-white/10 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate max-w-[300px]">{doc.filename}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">{doc.chunks > 0 ? `${doc.chunks} vector chunks` : "Parsing chunks..."}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isReady(doc.status) ? (
                          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 shimmer-skeleton text-zinc-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </span>
                        )}
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-zinc-600 hover:text-red-400 p-1 transition opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
