"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  GitBranch,
  Globe,
  Headphones,
  ArrowUpIcon,
  Mic,
  Paperclip,
  X,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import ReactMarkdown from "react-markdown";
import { TextShimmer } from "@/components/ui/text-shimmer";

const WEBHOOK = "https://n8n.srv1223027.hstgr.cloud/webhook/6c419e39-f35c-49a8-abb8-51b2de160070/chat";
const STORAGE_KEY = "onvero_chat_sessions";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "ai"; text: string; imageUrl?: string; }
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: string; }

// ── localStorage helpers ─────────────────────────────────────────────────────
function loadSessions(): ChatSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveSessions(s: ChatSession[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function createSession(): ChatSession {
  return { id: crypto.randomUUID(), title: "Neues Gespräch", messages: [], createdAt: new Date().toISOString() };
}

// ── Auto-resize hook ─────────────────────────────────────────────────────────
function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback((reset?: boolean) => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (reset) { ta.style.height = `${minHeight}px`; return; }
    ta.style.height = `${minHeight}px`;
    ta.style.height = `${Math.max(minHeight, Math.min(ta.scrollHeight, maxHeight ?? Infinity))}px`;
  }, [minHeight, maxHeight]);
  useEffect(() => { if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`; }, [minHeight]);
  useEffect(() => { const h = () => adjustHeight(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, [adjustHeight]);
  return { textareaRef, adjustHeight };
}

// ── Suggestion button ────────────────────────────────────────────────────────
function SuggestionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full border transition-colors cursor-pointer"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}>
      {icon}
      <span className="text-xs whitespace-nowrap">{label}</span>
    </button>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function ChatSidebar({
  sessions, activeId, collapsed, onSelect, onNew, onDelete, onToggle,
}: {
  sessions: ChatSession[];
  activeId: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}) {
  const groups: { label: string; items: ChatSession[] }[] = [];
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const today: ChatSession[] = [], yesterdayArr: ChatSession[] = [], older: ChatSession[] = [];
  for (const s of sessions) {
    const d = new Date(s.createdAt).toDateString();
    if (d === todayStr) today.push(s);
    else if (d === yesterdayStr) yesterdayArr.push(s);
    else older.push(s);
  }
  if (today.length) groups.push({ label: "Heute", items: today });
  if (yesterdayArr.length) groups.push({ label: "Gestern", items: yesterdayArr });
  if (older.length) groups.push({ label: "Älter", items: older });

  return (
    <div
      className="flex flex-col h-full shrink-0 transition-all duration-300 overflow-hidden"
      style={{
        width: collapsed ? 0 : 240,
        borderRight: collapsed ? "none" : "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: "1rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)", minWidth: 240 }}>
        <button onClick={onNew}
          className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
          <Plus className="w-4 h-4" /> Neues Gespräch
        </button>
        <button onClick={onToggle} className="p-2 ml-1 rounded-lg transition-colors cursor-pointer"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent", minWidth: 240 }}>
        {groups.map(group => (
          <div key={group.label} className="mb-2">
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.25)" }}>{group.label}</p>
            {group.items.map(session => (
              <div key={session.id} onClick={() => onSelect(session.id)}
                className="group flex items-center gap-2 mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: session.id === activeId ? "rgba(255,255,255,0.08)" : "transparent",
                  color: session.id === activeId ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                }}
                onMouseEnter={e => { if (session.id !== activeId) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (session.id !== activeId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.5 }} />
                <span className="text-xs truncate flex-1">{session.title}</span>
                <button onClick={e => { e.stopPropagation(); onDelete(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,100,100,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="px-4 py-6 text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>Noch keine Gespräche</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function BusinessAIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState("");
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<{ url: string; name: string; file: File } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 56, maxHeight: 200 });

  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) { setSessions(loaded); setActiveId(loaded[0].id); }
    else { const f = createSession(); setSessions([f]); setActiveId(f.id); saveSessions([f]); }
  }, []);

  const activeSession = sessions.find(s => s.id === activeId);
  const messages = activeSession?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => { if (sessions.length > 0) saveSessions(sessions); }, [sessions]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  function updateSession(id: string, updater: (s: ChatSession) => ChatSession) {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }

  function handleNewChat() {
    const s = createSession(); setSessions(prev => [s, ...prev]); setActiveId(s.id);
  }

  function handleDeleteChat(id: string) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (id === activeId) {
        if (next.length > 0) setActiveId(next[0].id);
        else { const f = createSession(); next.push(f); setActiveId(f.id); }
      }
      return next;
    });
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && !preview) || !activeSession) return;
    const userMsg: Message = { role: "user", text: text.trim(), imageUrl: preview?.url };
    const isFirst = activeSession.messages.length === 0;
    updateSession(activeId, s => ({
      ...s, messages: [...s.messages, userMsg],
      title: isFirst ? text.trim().slice(0, 40) + (text.trim().length > 40 ? "…" : "") : s.title,
    }));
    setValue(""); adjustHeight(true);
    const currentFile = preview?.file ?? null;
    setPreview(null); setLoading(true);

    try {
      const form = new FormData();
      form.append("chatInput", text.trim());
      form.append("sessionId", activeId);
      if (currentFile) form.append("data", currentFile);
      const res = await fetch(WEBHOOK, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      updateSession(activeId, s => ({ ...s, messages: [...s.messages, { role: "ai", text: json.output ?? "Keine Antwort erhalten." }] }));
    } catch {
      updateSession(activeId, s => ({ ...s, messages: [...s.messages, { role: "ai", text: "Es gab einen Fehler. Bitte versuche es erneut." }] }));
    } finally { setLoading(false); }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(value); }
  };

  return (
    <div className="relative flex w-full h-full min-h-[calc(100vh-5rem)] overflow-hidden">

      {/* DottedSurface only on empty chat (welcome screen) */}
      {!hasMessages && <DottedSurface />}

      {/* ── Sidebar ── */}
      <div className="relative z-10 h-full">
        <ChatSidebar
          sessions={sessions} activeId={activeId} collapsed={!sidebarOpen}
          onSelect={setActiveId} onNew={handleNewChat} onDelete={handleDeleteChat}
          onToggle={() => setSidebarOpen(p => !p)}
        />
      </div>

      {/* ── Chat area (always centered in remaining space) ── */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">

        {/* Toggle button when sidebar is collapsed */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}>
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        <div className={cn(
          "flex flex-col w-full max-w-2xl mx-auto px-4 flex-1",
          hasMessages ? "" : "items-center justify-center",
        )}>

          {/* Messages */}
          {hasMessages ? (
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 space-y-4"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                      color: msg.role === "user" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)",
                      border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none",
                    }}>
                    {msg.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.imageUrl} alt="Upload" className="rounded-lg mb-2 object-cover"
                        style={{ maxWidth: 180, maxHeight: 120, border: "1px solid rgba(255,255,255,0.1)" }} />
                    )}
                    {msg.role === "ai" ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_strong]:text-white [&_a]:text-blue-400 [&_a]:underline [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-white/5 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <TextShimmer className="text-sm font-medium" duration={1}>
                      Denkt nach…
                    </TextShimmer>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-white mb-8">Wie kann ich Ihnen helfen?</h1>
          )}

          {/* Input */}
          <div className={cn("w-full", hasMessages ? "pb-6 pt-2" : "pb-6")}>
            <div className="relative rounded-xl overflow-hidden"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}>

              {preview && (
                <div className="px-4 pt-3 pb-1">
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url} alt={preview.name} className="rounded-lg object-cover"
                      style={{ width: 64, height: 64, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <button type="button"
                      onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                      style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-y-auto">
                <Textarea ref={textareaRef} value={value}
                  onChange={e => { setValue(e.target.value); adjustHeight(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Stell eine Frage an deine Business AI…"
                  className={cn(
                    "w-full px-4 py-4 resize-none bg-transparent border-none text-white text-sm",
                    "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    "placeholder:text-white/25 placeholder:text-sm",
                  )}
                  style={{ overflow: "hidden", minHeight: 56 }} />
              </div>

              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setPreview({ url: URL.createObjectURL(file), name: file.name, file });
                  e.target.value = "";
                }} />

              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                    <Mic className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <button type="button" onClick={() => sendMessage(value)} disabled={loading}
                  className={cn(
                    "p-2 rounded-lg text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
                    value.trim() || preview ? "bg-white text-black" : "border text-white/30",
                  )}
                  style={value.trim() || preview ? {} : { borderColor: "rgba(255,255,255,0.1)" }}>
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!hasMessages && (
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                <SuggestionButton icon={<BarChart2 className="w-3.5 h-3.5" />} label="Umsatz diese Woche" onClick={() => sendMessage("Wie war der Umsatz diese Woche?")} />
                <SuggestionButton icon={<Globe className="w-3.5 h-3.5" />} label="Website Performance" onClick={() => sendMessage("Wie performt unsere Website aktuell?")} />
                <SuggestionButton icon={<GitBranch className="w-3.5 h-3.5" />} label="Offene Workflows" onClick={() => sendMessage("Welche Workflows sind gerade offen?")} />
                <SuggestionButton icon={<Headphones className="w-3.5 h-3.5" />} label="Support-Tickets" onClick={() => sendMessage("Zeig mir die aktuellen Support-Tickets.")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
