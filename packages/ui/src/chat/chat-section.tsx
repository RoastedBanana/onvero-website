"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import {
  WEBHOOK_URL,
  MAX_MESSAGES_PER_WINDOW,
  getUsedCount,
  recordSend,
  isRateLimited,
} from "@/lib/chat-config";
import { TextShimmer } from "../effects/text-shimmer";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

// ── Thinking animation ─────────────────────────────────────────────────────────
function ThinkingAnimation({ text }: { text: string }) {
  return (
    <TextShimmer
      duration={1.4}
      spread={3}
      className="text-sm font-medium py-0.5"
    >
      {text}
    </TextShimmer>
  );
}

// ── AI Avatar ─────────────────────────────────────────────────────────────────
function AIAvatar() {
  return (
    <div
      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      KI
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  content: string;
  sender: "ai" | "user";
}

// Initial message — rendered inside component so it can use translation
const INITIAL_DE = "Hallo! Wie kann ich dir helfen?";
const INITIAL_EN = "Hi! How can I help you?";

// ── Component ─────────────────────────────────────────────────────────────────
export function ChatSection() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: t(INITIAL_DE, INITIAL_EN), sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [limited, setLimited] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasSentMessage = useRef(false);

  // Read rate-limit state from localStorage on mount
  useEffect(() => {
    setLimited(isRateLimited());
    setUsedCount(getUsedCount());
  }, []);

  useEffect(() => {
    if (!hasSentMessage.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || limited) return;

    // Check again right before sending (in case limit was reached in another tab)
    if (isRateLimited()) {
      setLimited(true);
      return;
    }

    recordSend();
    const newCount = getUsedCount();
    setUsedCount(newCount);
    if (newCount >= MAX_MESSAGES_PER_WINDOW) setLimited(true);

    hasSentMessage.current = true;
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, content: input.trim(), sender: "user" },
    ]);
    setInput("");
    setIsLoading(true);

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        const reply =
          typeof data === "string"
            ? data
            : data?.output ?? data?.message ?? data?.text ?? data?.reply ?? JSON.stringify(data);
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, content: reply, sender: "ai" },
        ]);
      })
      .catch(() => {
        // Webhook unreachable — stay silent, just stop loading
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <section
        className="w-full py-32 px-8 md:px-16 lg:px-24 relative"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        {/* Subtle radial glow behind the box */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 50% 60%, rgba(255,255,255,0.025) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-xl mx-auto relative">

          {/* ── Headline ── */}
          <motion.div className="text-center mb-14" {...fadeUp(0)}>
            <h2
              className="font-bold text-white tracking-tight mb-3"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}
            >
              {t("Noch Fragen?", "Still got questions?")}
            </h2>
            {/* Subtle white underline accent */}
            <div
              className="mx-auto mb-4"
              style={{
                width: 40,
                height: 1,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
            />
            <p className="text-base" style={{ color: "rgba(255,255,255,0.38)" }}>
              {t("Sprich mit unserem KI-Assistenten", "Chat with our AI assistant")}
            </p>
          </motion.div>

          {/* ── Floating chat box ── */}
          <motion.div
            {...fadeUp(0.15)}
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(255,255,255,0.03)",
              maxWidth: 660,
              margin: "0 auto",
            }}
          >
            {/* ── Message area ── */}
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={{
                padding: "28px 24px",
                height: 340,
              }}
            >
              <div className="flex flex-col gap-5">
                {messages.map((msg) =>
                  msg.sender === "ai" ? (
                    <div key={msg.id} className="flex items-start gap-3">
                      <AIAvatar />
                      <p
                        className="leading-relaxed pt-0.5"
                        style={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-end">
                      <p
                        className="leading-relaxed text-right"
                        style={{
                          fontSize: 14,
                          color: "rgba(255,255,255,0.55)",
                          maxWidth: "80%",
                        }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  )
                )}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <AIAvatar />
                    <ThinkingAnimation text={t("Schreibt...", "Thinking...")} />
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

            {/* ── Rate-limit notice ── */}
            {limited && (
              <div
                className="px-5 py-3 text-xs text-center"
                style={{ color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                {t(
                  `Tageslimit von ${MAX_MESSAGES_PER_WINDOW} Nachrichten erreicht. Bitte morgen zurückkommen oder direkt ein Gespräch buchen.`,
                  `Daily limit of ${MAX_MESSAGES_PER_WINDOW} messages reached. Please come back tomorrow or book a call directly.`
                )}
              </div>
            )}

            {/* ── Input bar ── */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3"
              style={{
                background: limited ? "rgba(26,26,26,0.5)" : "#1a1a1a",
                borderRadius: "0 0 20px 20px",
                padding: "14px 16px",
                borderLeft: `2px solid ${limited ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)"}`,
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              {/* Mic icon */}
              <button
                type="button"
                className="shrink-0 flex items-center justify-center"
                style={{ opacity: 0.18, color: "white", background: "none", border: "none", cursor: "default" }}
                tabIndex={-1}
              >
                <Mic style={{ width: 18, height: 18 }} />
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  limited
                    ? t("Limit erreicht", "Limit reached")
                    : t("Schreib eine Nachricht...", "Write a message...")
                }
                disabled={limited}
                rows={1}
                className="chat-input-ta flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
                style={{
                  color: limited ? "rgba(255,255,255,0.25)" : "white",
                  border: "none",
                  caretColor: "white",
                  cursor: limited ? "not-allowed" : "text",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent);
                  }
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 72) + "px";
                }}
              />

              {/* Counter badge — shown when approaching the limit */}
              {!limited && usedCount >= MAX_MESSAGES_PER_WINDOW - 3 && (
                <span
                  className="shrink-0 text-[10px] font-medium tabular-nums"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {MAX_MESSAGES_PER_WINDOW - usedCount}
                </span>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || limited}
                className="shrink-0 flex items-center justify-center transition-opacity duration-150"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: input.trim() && !isLoading && !limited ? "#ffffff" : "rgba(255,255,255,0.1)",
                  border: "none",
                  cursor: input.trim() && !isLoading && !limited ? "pointer" : "default",
                }}
              >
                <ArrowUp style={{ width: 16, height: 16, color: input.trim() && !isLoading && !limited ? "#000000" : "rgba(255,255,255,0.4)" }} />
              </button>
            </form>
          </motion.div>

          {/* placeholder style for the textarea */}
          <style>{`
            .chat-input-ta::placeholder { color: rgba(255,255,255,0.25); }
          `}</style>

        </div>
      </section>
    </>
  );
}
