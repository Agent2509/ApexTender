"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Send, Loader2, Download, Play, FileText, Terminal } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";

interface ChatMessage { role: "user" | "assistant"; content: string; }
interface DocumentMeta { id: number; filename: string; status: string; }
interface Project { id: string; name: string; description?: string; }

export default function ChatWorkspace({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = async (extra?: Record<string, string>): Promise<Record<string, string>> => {
    const token = await getToken();
    return { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token", ...extra };
  };

  const addDebugLog = (msg: string) => {
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchProject = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API}/api/v1/projects`, { headers });
        if (res.ok) {
          const data = await res.json();
          const found = data.find((p: Project) => p.id === projectId);
          if (found) { setProject(found); addDebugLog(`Project loaded: ${found.name}`); }
        }
      } catch (e) { addDebugLog(`Error: ${e}`); }
    };
    const fetchDocs = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API}/api/v1/documents?project_id=${projectId}`, { headers });
        if (res.ok) { const data = await res.json(); setDocuments(data); addDebugLog(`${data.length} docs loaded.`); }
      } catch (e) { addDebugLog(`Error: ${e}`); }
    };
    fetchProject();
    fetchDocs();
  }, [isLoaded, isSignedIn, projectId]);

  const handleSearch = async () => {
    if (!question.trim() || !project) return;
    const userMsg: ChatMessage = { role: "user", content: question.trim() };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setQuestion("");
    setIsLoading(true);
    setSources([]);
    addDebugLog(`Search initiated. History length: ${history.length}`);
    try {
      const headers = await getHeaders({ "Content-Type": "application/json", Accept: "text/event-stream" });
      const endpoint = `${API}/api/v1/projects/${projectId}/search`;
      addDebugLog(`POST ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST", headers,
        body: JSON.stringify({ query: userMsg.content, limit: 5, history }),
      });
      if (!res.ok) {
        const errText = await res.text();
        addDebugLog(`Error: ${res.status} - ${errText}`);
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `⚠️ Error: ${errText}` }; return u; });
        setIsLoading(false); return;
      }
      if (!res.body) throw new Error("No response body");
      addDebugLog("SSE connection established. Streaming...");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, buffer = "";
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith("data:")) {
              try {
                const data = JSON.parse(line.replace(/^data:\s*/, ""));
                if (data.type === "chunk") {
                  setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + data.text }; return u; });
                } else if (data.type === "sources") {
                  setSources(data.data);
                  addDebugLog(`Sources loaded: ${data.data.length} items.`);
                } else if (data.type === "error") {
                  addDebugLog(`Stream error: ${data.text}`);
                  setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `⚠️ ${data.text}` }; return u; });
                }
              } catch {}
            }
          }
        }
      }
      addDebugLog("Stream completed successfully.");
    } catch (err: any) {
      addDebugLog(`Exception: ${err.message || err}`);
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `⚠️ ${err.message}` }; return u; });
    } finally { setIsLoading(false); }
  };

  const handleExport = async () => {
    const lastAI = [...messages].reverse().find(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️"));
    if (!lastAI || !project) return;
    setIsExporting(true);
    addDebugLog("Starting document export...");
    try {
      const headers = await getHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${API}/api/v1/projects/${projectId}/export`, { method: "POST", headers, body: JSON.stringify({ content: lastAI.content }) });
      if (!res.ok) { addDebugLog(`Export failed: ${res.status}`); alert("Export failed"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${project.name.replace(/\s+/g, "_")}_Response.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      addDebugLog("Export complete. File downloaded.");
    } catch (e) {
      addDebugLog(`Export error: ${e}`);
      alert("Failed to export.");
    } finally { setIsExporting(false); }
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
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white truncate max-w-[200px]">
              {project ? `${project.name} Workspace` : "AI Workspace"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {messages.some(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️")) && !isLoading && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export Word Doc
              </button>
            )}
          </div>
        </div>

        {/* Main Content: Sidebar + Chat */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar: Docs & Debug */}
          <aside className="w-72 border-r border-white/5 flex flex-col flex-shrink-0 hidden md:flex overflow-y-auto bg-black/40">
            {/* Docs */}
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Ingested PDFs</h3>
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No documents ingested.</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs text-zinc-300 truncate">
                      <FileText className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      <span className="truncate flex-1">{doc.filename}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Debug Console */}
            <div className="flex-1 flex flex-col border-t border-white/5 min-h-[200px]">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Debug Console</span>
              </div>
              <div className="flex-1 bg-black/60 p-4 font-mono text-[10px] text-zinc-600 overflow-y-auto space-y-1">
                {debugLogs.length === 0 ? (
                  <p className="italic text-zinc-700">Waiting for events...</p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed whitespace-pre-wrap break-all">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {/* Ambient Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 max-w-md mx-auto text-center space-y-4">
                  <div className="p-4 glass-card rounded-3xl">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <span className="text-white font-black text-lg">A</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-white">ApexTender AI RAG</h2>
                  <p className="text-xs leading-relaxed">
                    Query your project&apos;s vector store. AI responses will be supported by exact snippets and source page citations.
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg leading-relaxed text-sm ${
                          msg.role === "user"
                            ? "bg-white/[0.05] text-zinc-100 rounded-br-sm border border-white/10"
                            : "glass-card text-zinc-200 rounded-bl-sm"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Play className="w-3 h-3 text-purple-400 fill-purple-400" />
                            <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">
                              RAG Analysis
                            </span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                        {/* Loading indicator */}
                        {msg.role === "assistant" && msg.content === "" && isLoading && idx === messages.length - 1 && (
                          <div className="flex items-center gap-1 py-1">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Sources section */}
                  {sources.length > 0 && !isLoading && (
                    <div className="pt-4 border-t border-white/5 space-y-2 mt-4">
                      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        Verified Citations
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {sources.map((result, idx) => (
                          <div
                            key={idx}
                            className="glass-card p-4 hover:border-white/10 transition"
                          >
                            <div className="flex justify-between items-center gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                <span className="text-xs font-bold text-zinc-300 truncate max-w-[200px]">
                                  {result.filename || "unknown"}
                                </span>
                                {result.page_number && (
                                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                    p. {result.page_number}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
                                Score: {result.similarity_score?.toFixed(3)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed italic">
                              &quot;{result.snippet || result.chunk_text}&quot;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 flex-shrink-0 relative z-10">
              <div className="max-w-3xl mx-auto flex gap-3">
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSearch()}
                  placeholder="Ask a question about project documents..."
                  className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition placeholder:text-zinc-600"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !question.trim()}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
