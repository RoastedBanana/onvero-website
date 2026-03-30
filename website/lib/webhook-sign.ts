import { createHmac } from 'crypto';

const SIGNING_SECRET = process.env.N8N_WEBHOOK_SECRET ?? '';

/**
 * Sign a webhook payload with HMAC-SHA256.
 * Sends the signature as x-webhook-signature header.
 * n8n can verify this to ensure the request came from our server.
 */
export function signPayload(body: string): string {
  return createHmac('sha256', SIGNING_SECRET).update(body).digest('hex');
}

/**
 * Build headers for signed webhook requests.
 * Includes both the legacy x-webhook-secret (backward compat)
 * and the new x-webhook-signature (HMAC).
 */
export function getSignedHeaders(body: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-webhook-secret': SIGNING_SECRET,
    'x-webhook-signature': signPayload(body),
    'x-webhook-timestamp': Date.now().toString(),
  };
}
