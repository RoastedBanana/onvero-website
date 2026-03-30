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
} from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";

// ── Auto-resize hook ─────────────────────────────────────────────────────────
function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const ta = textareaRef.current;
      if (!ta) return;
      if (reset) { ta.style.height = `${minHeight}px`; return; }
      ta.style.height = `${minHeight}px`;
      ta.style.height = `${Math.max(minHeight, Math.min(ta.scrollHeight, maxHeight ?? Infinity))}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const h = () => adjustHeight();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// ── Suggestion button ────────────────────────────────────────────────────────
function SuggestionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-4 py-2 rounded-full border transition-colors cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
    >
      {icon}
      <span className="text-xs whitespace-nowrap">{label}</span>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function BusinessAIChat() {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 56, maxHeight: 200 });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[calc(100vh-5rem)] overflow-hidden">
      <DottedSurface />
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl mx-auto px-4 gap-8">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white">
          Wie kann ich Ihnen helfen?
        </h1>

        {/* Chat input */}
        <div className="w-full">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Image preview */}
            {preview && (
              <div className="px-4 pt-3 pb-1">
                <div className="relative inline-block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="rounded-lg object-cover"
                    style={{ width: 64, height: 64, border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p
                    className="text-[10px] mt-1 truncate max-w-[64px]"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {preview.name}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-y-auto">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={e => { setValue(e.target.value); adjustHeight(); }}
                onKeyDown={handleKeyDown}
                placeholder="Stell eine Frage an deine Business AI…"
                className={cn(
                  "w-full px-4 py-4",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-white text-sm",
                  "focus:outline-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-white/25 placeholder:text-sm",
                )}
                style={{ overflow: "hidden", minHeight: 56 }}
              />
            </div>

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setPreview({ url, name: file.name });
                }
                e.target.value = "";
              }}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                  value.trim()
                    ? "bg-white text-black"
                    : "border text-white/30",
                )}
                style={value.trim() ? {} : { borderColor: "rgba(255,255,255,0.1)" }}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Senden</span>
              </button>
            </div>
          </div>

          {/* Suggestion pills */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            <SuggestionButton icon={<BarChart2 className="w-3.5 h-3.5" />} label="Umsatz diese Woche" />
            <SuggestionButton icon={<Globe className="w-3.5 h-3.5" />} label="Website Performance" />
            <SuggestionButton icon={<GitBranch className="w-3.5 h-3.5" />} label="Offene Workflows" />
            <SuggestionButton icon={<Headphones className="w-3.5 h-3.5" />} label="Support-Tickets" />
          </div>
        </div>

      </div>
    </div>
  );
}
