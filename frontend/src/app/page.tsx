"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, SignOutButton, UserButton, RedirectToSignIn } from "@clerk/nextjs";
import { UploadCloud, FileText, Play, CheckCircle, Database, LayoutDashboard, Settings, Loader2, Trash2, Download, Plus, LogOut, User, X, Send, MessageSquare, Mountain } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn, has } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && has) {
      if (!has({ plan: 'pro' })) {
        // router.push('/pricing');
      }
    }
  }, [isLoaded, isSignedIn, has, router]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [sources, setSources] = useState<{ chunk_text: string, filename: string, page_number: number | null, snippet: string, document_id: number, similarity_score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state so handleSearch always reads latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Upload State ---
  const [isUploading, setIsUploading] = useState(false);
  const [ingestedFiles, setIngestedFiles] = useState<{ id: number, name: string, status: string, chunks: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Project State ---
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<{ id: string, name: string } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Build auth headers using Clerk JWT ---
  const getHeaders = async (extraHeaders?: Record<string, string>): Promise<Record<string, string>> => {
    const token = await getToken();
    return {
      "Authorization": token ? `Bearer ${token}` : "Bearer mock-dev-token",
      ...extraHeaders,
    };
  };

  // --- Fetch Projects ---
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchProjects = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) setSelectedProject(data[0]);
        } else {
          console.error('Server status error:', res.status, await res.text());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProjects();
  }, [isLoaded, isSignedIn]);

  // --- Refresh State ---
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Fetch persistent list on load & refresh ---
  useEffect(() => {
    if (!selectedProject || !isLoaded || !isSignedIn) return;

    const fetchDocuments = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/documents?project_id=${selectedProject.id}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setIngestedFiles(data.map((d: any) => ({
            id: d.id,
            name: d.filename,
            status: d.status,
            chunks: d.chunks
          })));
        }
      } catch (e) {
        console.error("Fetch failed:", e);
      }
    };

    fetchDocuments();
  }, [selectedProject?.id, isLoaded, isSignedIn, refreshKey]);

  // --- Task Polling Logic ---
  const [activeTasks, setActiveTasks] = useState<string[]>([]);

  useEffect(() => {
    if (activeTasks.length === 0 || !isLoaded || !isSignedIn) return;
    
    const interval = setInterval(async () => {
      const headers = await getHeaders();
      for (const taskId of activeTasks) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tasks/${taskId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'Success' || data.status === 'Failure') {
              setActiveTasks(prev => prev.filter(id => id !== taskId));
              setRefreshKey(prev => prev + 1);
            }
          }
        } catch (e) {
          console.error("Task poll error:", e);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTasks, isLoaded, isSignedIn]);

  // --- Delete handler ---
  const handleDelete = async (id: number) => {
    if (!id) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/documents/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        setIngestedFiles(prev => prev.filter(f => f.id !== id));
      } else {
        console.error("Delete failed with status", res.status);
      }
    } catch (error) {
      console.error("Delete connection error:", error);
    }
  };

  // --- Upload Handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = await getHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${selectedProject.id}/documents`, {
        method: "POST",
        headers,
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        if (data.task_id) {
          setActiveTasks(prev => [...prev, data.task_id]);
        }
        setIngestedFiles(prev => [...prev, { id: data.document_id || 0, name: file.name, status: "Processing", chunks: 0 }]);
      } else {
        alert(`Upload failed: ${data.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upload connection error:", error);
      alert("Critical Error: Cannot reach the backend engine.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSearch = async () => {
    if (!question.trim() || !selectedProject) return;

    const userMessage: ChatMessage = { role: "user", content: question.trim() };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };

    // Use ref to avoid stale closure — always reads the LATEST messages
    const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
    console.log("[RFP Chat] Sending history with", history.length, "messages");

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setQuestion("");
    setIsLoading(true);
    setSources([]);

    try {
      const headers = await getHeaders({ 
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${selectedProject.id}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: userMessage.content,
          limit: 5,
          history: history
        })
      });

      if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            errorData = { detail: "Unknown error" };
        }
        // Update the last assistant message with error
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `⚠️ Error: ${errorData.detail || "Unknown error"}` };
          return updated;
        });
        setIsLoading(false);
        return;
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          
          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith("data:")) {
              const dataStr = line.replace(/^data:\s*/, "");
              try {
                const data = JSON.parse(dataStr);
                if (data.type === "chunk") {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: updated[updated.length - 1].content + data.text
                    };
                    return updated;
                  });
                } else if (data.type === "sources") {
                  setSources(data.data);
                } else if (data.type === "error") {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: `⚠️ Streaming error: ${data.text}` };
                    return updated;
                  });
                }
              } catch (e) {
                console.warn("Failed to parse SSE line:", line);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Search connection error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `⚠️ Connection failed: ${error.message || error}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const headers = await getHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(prev => [...prev, data]);
        setSelectedProject(data);
        setNewProjectName("");
        setNewProjectDesc("");
        setIngestedFiles([]);
        setMessages([]);
        setSources([]);
        setIsModalOpen(false);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setIsCreatingProject(false);
    }
  };

  // --- Export as Word Document (exports last assistant message) ---
  const handleExport = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️"));
    if (!lastAssistant || !selectedProject) return;
    setIsExporting(true);
    try {
      const headers = await getHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${selectedProject.id}/export`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: lastAssistant.content })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Export failed" }));
        alert(`Export failed: ${errData.detail || "Unknown error"}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Generated_Response.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed: Could not reach the backend.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Loading state while Clerk is loading ---
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // --- Strict Protection ---
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Mountain className="w-6 h-6 text-emerald-500" />
            ApexTender
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Enterprise Edition</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
            <LayoutDashboard className="w-5 h-5" />
            Active Project
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <FileText className="w-5 h-5" />
            Past Bids
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        {/* User card at bottom of sidebar */}
        {user && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.fullName || "User"}</p>
                <p className="text-xs text-slate-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-6 md:px-10 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const proj = projects.find(p => p.id === e.target.value);
                if (proj) {
                  setSelectedProject(proj);
                  setIngestedFiles([]);
                  setMessages([]);
                  setSources([]);
                }
              }}
              className="bg-slate-800 border border-slate-700 text-white text-lg font-semibold rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-slate-400 hidden sm:inline">Fleet Online (Docker)</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                Document Ingestion
              </h3>
              <div
                className="border-2 border-dashed border-slate-600 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer bg-slate-900/50 group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const mockEvent = { target: { files: e.dataTransfer.files } } as any;
                    handleFileUpload(mockEvent);
                  }
                }}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                {isUploading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-blue-500 mb-3 animate-spin" />
                    <p className="text-sm font-medium text-slate-300">Handing off to Worker...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="text-sm font-medium text-slate-300">Drag & Drop or Click to upload RFP PDFs</p>
                  </>
                )}
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-medium text-white mb-4">Ingested Memory</h3>
              <div className="space-y-3">
                {ingestedFiles.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No records in PostgreSQL yet.</p>
                ) : (
                  ingestedFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg group">
                      <div className="flex items-center gap-3">
                        {(f.status === "Processing" || f.status === "Pending" || f.status === "processing") ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <CheckCircle className={(f.status === "Completed" || f.status === "ready") ? "w-4 h-4 text-green-500" : "w-4 h-4 text-slate-500"} />
                        )}
                        <span className="text-sm text-slate-300">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(f.status === "Processing" || f.status === "Pending" || f.status === "processing") && (
                          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full animate-pulse">Processing Document...</span>
                        )}
                        <span className="text-xs text-slate-500">{f.status} ({f.chunks} chunks)</span>
                        <button 
                          onClick={() => handleDelete(f.id)} 
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                RFP Chat
              </h3>
              <div className="flex items-center gap-2">
                {messages.some(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️")) && !isLoading && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 animate-[pulse_2s_ease-in-out_infinite]"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download as Word
                  </button>
                )}
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setSources([]); }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-300 hover:scale-105 transition-all px-2 py-1"
                  >
                    Clear Chat
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto space-y-4 min-h-[300px] max-h-[60vh]">
              {messages.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-12">
                  <MessageSquare className="w-12 h-12 opacity-20" />
                  <p className="text-sm text-center">Ask a question about your RFP documents.</p>
                  <p className="text-xs text-slate-600 text-center">Conversations are remembered for follow-up questions.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex animate-in fade-in slide-in-from-bottom-4 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${
                        msg.role === "user" 
                          ? "bg-slate-700 text-slate-100 rounded-br-sm" 
                          : "bg-slate-900 border border-emerald-500/30 text-slate-200 rounded-bl-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      }`}>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Play className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">AI</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || (isLoading && idx === messages.length - 1 ? "" : "")}</p>
                        {msg.role === "assistant" && msg.content === "" && isLoading && idx === messages.length - 1 && (
                          <div className="flex items-center gap-1 pt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sources.length > 0 && !isLoading && (
                    <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Sources</h4>
                      {sources.map((result, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-semibold text-blue-400 truncate max-w-[200px]">{result.filename || "unknown"}</span>
                              {result.page_number && (
                                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">p.{result.page_number}</span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">Score: {result.similarity_score.toFixed(3)}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-400 whitespace-pre-wrap line-clamp-3">{result.snippet || result.chunk_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl">
              <div className="flex gap-3">
                <input
                  type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSearch()}
                  placeholder="Ask a follow-up question..." className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSearch} disabled={isLoading || !question.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg font-medium hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white tracking-tight">Create New Project</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp RFP"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea
                  placeholder="Brief description of the project..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner min-h-[100px] resize-y"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isCreatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreatingProject ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}