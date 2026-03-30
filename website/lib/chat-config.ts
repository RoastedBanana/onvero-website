// ─── Chat Webhook Configuration ──────────────────────────────────────────────
// Change WEBHOOK_URL here to update the endpoint for all chat messages.

export const WEBHOOK_URL = "/api/chat";

// ─── Rate Limit ───────────────────────────────────────────────────────────────
// MAX_MESSAGES_PER_WINDOW: maximum number of messages a user may send
// WINDOW_MS: rolling time window in milliseconds (default: 24 h)
export const MAX_MESSAGES_PER_WINDOW = 50;
export const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const LS_KEY = "onveo_chat_timestamps";

/** Returns how many messages the user has sent within the current window. */
export function getUsedCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return 0;
  const timestamps: number[] = JSON.parse(raw);
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((ts) => ts > cutoff).length;
}

/** Records a new message send. Call this right before the fetch. */
export function recordSend(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LS_KEY);
  const timestamps: number[] = raw ? JSON.parse(raw) : [];
  const cutoff = Date.now() - WINDOW_MS;
  const fresh = timestamps.filter((ts) => ts > cutoff);
  fresh.push(Date.now());
  localStorage.setItem(LS_KEY, JSON.stringify(fresh));
}

/** Returns true when the user has hit the limit. */
export function isRateLimited(): boolean {
  return getUsedCount() >= MAX_MESSAGES_PER_WINDOW;
}
