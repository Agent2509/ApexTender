"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { ArrowLeft, Send, Loader2, Download, Mountain, Play, FileText, CheckCircle2, Terminal } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DocumentMetadata {
  id: number;
  filename: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function ChatWorkspace({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Debug logs for God Mode
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("admin_bypass") === "CHIEF_FAIZAN_2026");
    }
  }, []);

  const userPlan = isAdmin ? "developer" : (user?.publicMetadata?.plan as string) || "free";
  const showDebugConsole = userPlan === "developer" || userPlan === "admin";

  const addDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const getHeaders = async (extraHeaders?: Record<string, string>): Promise<Record<string, string>> => {
    const token = await getToken();
    return {
      "Authorization": token ? `Bearer ${token}` : "Bearer mock-dev-token",
      ...extraHeaders,
    };
  };

  // Sync messages with ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Initial loads
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    addDebugLog("Initializing chat workspace...");
    if (isAdmin) {
      addDebugLog("God Mode detected via CHIEF_FAIZAN_2026 local override.");
    }

    const fetchProjectDetails = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects`, { headers });
        if (res.ok) {
          const data = await res.json();
          const found = data.find((p: Project) => p.id === projectId);
          if (found) {
            setProject(found);
            addDebugLog(`Project data loaded: ${found.name}`);
          }
        }
      } catch (e) {
        addDebugLog(`Error fetching project details: ${e}`);
      }
    };

    const fetchDocs = async () => {
      try {
        const headers = await getHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/documents?project_id=${projectId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          addDebugLog(`${data.length} documents fetched for active project.`);
        }
      } catch (e) {
        addDebugLog(`Error fetching documents: ${e}`);
      }
    };

    fetchProjectDetails();
    fetchDocs();
  }, [isLoaded, isSignedIn, projectId]);

  const handleSearch = async () => {
    if (!question.trim() || !project) return;

    const userMessage: ChatMessage = { role: "user", content: question.trim() };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };

    const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
    addDebugLog(`Initiating search with history length: ${history.length}`);

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setQuestion("");
    setIsLoading(true);
    setSources([]);

    try {
      const headers = await getHeaders({
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      });
      
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${projectId}/search`;
      addDebugLog(`POST request to ${endpoint}`);

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: userMessage.content,
          limit: 5,
          history: history,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        addDebugLog(`Error response from search API: ${res.status} - ${errText}`);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `⚠️ Error: ${errText || "Backend error"}` };
          return updated;
        });
        setIsLoading(false);
        return;
      }

      if (!res.body) {
        addDebugLog("SSE stream failed: missing response body");
        throw new Error("No response body");
      }

      addDebugLog("SSE connection established. Streaming chunks...");
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
                      content: updated[updated.length - 1].content + data.text,
                    };
                    return updated;
                  });
                } else if (data.type === "sources") {
                  setSources(data.data);
                  addDebugLog(`Sources loaded: ${data.data.length} items.`);
                } else if (data.type === "error") {
                  addDebugLog(`Streaming error payload: ${data.text}`);
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: `⚠️ Streaming error: ${data.text}` };
                    return updated;
                  });
                }
              } catch (e) {
                // Ignore parse failures on partial payloads
              }
            }
          }
        }
      }
      addDebugLog("Stream completed successfully.");
    } catch (error: any) {
      addDebugLog(`Search connection exception: ${error.message || error}`);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `⚠️ Connection failed: ${error.message || error}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️"));
    if (!lastAssistant || !project) return;
    setIsExporting(true);
    addDebugLog("Starting document export...");
    try {
      const headers = await getHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/projects/${projectId}/export`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: lastAssistant.content }),
      });
      if (!res.ok) {
        addDebugLog(`Export failed with status ${res.status}`);
        alert("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}_Response.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addDebugLog("Export complete. File downloaded.");
    } catch (e) {
      addDebugLog(`Export error: ${e}`);
      alert("Failed to export.");
    } finally {
      setIsExporting(false);
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
    <div className="h-screen w-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950 flex-shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`} className="text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">
              {project ? `${project.name} Workspace` : "AI Workspace"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {messages.some(m => m.role === "assistant" && m.content && !m.content.startsWith("⚠️")) && !isLoading && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export Word Doc
            </button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Container splits screen: Sidebar & Chat Space */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left pane: Docs & Debug Logs */}
        <aside className="w-80 bg-zinc-900/40 border-r border-zinc-900 flex flex-col flex-shrink-0 hidden md:flex overflow-y-auto">
          {/* Docs header */}
          <div className="p-4 border-b border-zinc-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ingested PDFs</h3>
            <div className="mt-3 space-y-2">
              {documents.length === 0 ? (
                <p className="text-xs text-zinc-550 italic">No documents ingested.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs text-zinc-300 truncate">
                    <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate flex-1">{doc.filename}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* God mode debug logs */}
          {showDebugConsole && (
            <div className="flex-1 flex flex-col border-t border-zinc-900 min-h-[250px]">
              <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Debug Console (God Mode)</span>
              </div>
              <div className="flex-1 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-500 overflow-y-auto space-y-1">
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
          )}
        </aside>

        {/* Right pane: Chat Interface */}
        <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-550 max-w-md mx-auto text-center space-y-4">
                <div className="p-4 bg-zinc-900 rounded-3xl border border-zinc-850">
                  <Mountain className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-white">ApexTender AI RAG</h2>
                <p className="text-xs leading-relaxed">
                  Query your project's vector store. AI responses will be supported by exact snippets and source page citations.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg leading-relaxed text-sm ${
                        msg.role === "user"
                          ? "bg-zinc-800 text-zinc-100 rounded-br-sm border border-zinc-700"
                          : "bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                            RAG Analysis
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                      {/* Loading indicator */}
                      {msg.role === "assistant" && msg.content === "" && isLoading && idx === messages.length - 1 && (
                        <div className="flex items-center gap-1 py-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Sources section */}
                {sources.length > 0 && !isLoading && (
                  <div className="pt-4 border-t border-zinc-900 space-y-2 mt-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                      Verified Citations
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {sources.map((result, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 hover:border-zinc-800 transition"
                        >
                          <div className="flex justify-between items-center gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              <span className="text-xs font-bold text-zinc-300 truncate max-w-[200px]">
                                {result.filename || "unknown"}
                              </span>
                              {result.page_number && (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                                  p. {result.page_number}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-550 flex-shrink-0">
                              Score: {result.similarity_score.toFixed(3)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed italic">
                            "{result.snippet || result.chunk_text}"
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

          {/* Bottom input area */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex-shrink-0 relative z-10">
            <div className="max-w-3xl mx-auto flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSearch()}
                placeholder="Ask a question about project documents..."
                className="flex-1 bg-zinc-900 border border-zinc-850 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-700 transition"
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !question.trim()}
                className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 px-5 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
