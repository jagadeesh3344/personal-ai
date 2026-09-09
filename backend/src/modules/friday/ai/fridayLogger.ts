export type FridayEventType =
  | 'FRIDAY_REQUEST'
  | 'GEMINI_REQUEST_STARTED'
  | 'GEMINI_RESPONSE_RECEIVED'
  | 'TOOL_CALL_REQUESTED'
  | 'TOOL_EXECUTED'
  | 'TOOL_RESULT_RETURNED'
  | 'FRIDAY_FINAL_RESPONSE';

/**
 * Structured development logger for FRIDAY AI pipeline.
 * NEVER logs API keys, auth tokens, passwords, or sensitive PII.
 */
export function logFridayEvent(
  eventType: FridayEventType,
  payload?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  // Sanitize any accidental sensitive keys or nested fields
  const safePayload = payload ? sanitizePayload(payload) : undefined;
  console.log(
    `[${timestamp}] [${eventType}]`,
    safePayload ? JSON.stringify(safePayload) : ''
  );
}

function sanitizePayload(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase();
    if (
      lk.includes('key') ||
      lk.includes('token') ||
      lk.includes('password') ||
      lk.includes('secret') ||
      lk.includes('auth') ||
      lk.includes('bearer')
    ) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = sanitizePayload(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

