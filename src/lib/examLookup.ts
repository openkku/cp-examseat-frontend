/**
 * Fetching a student's exams from `/api/exam`.
 *
 * For rounds served by the faculty's checkex system, the backend fetches a
 * student it has not seen yet through a paced queue. When the turn does not
 * come in time it answers `202 {"queued": true, "position": N, "retry_after": S}`
 * and keeps the lookup running, so the client asks again after S seconds.
 */

/** How long to keep retrying a queued lookup before giving up. */
export const QUEUE_RETRY_LIMIT_MS = 2 * 60 * 1000;

const DEFAULT_RETRY_AFTER_S = 5;

export interface QueuedLookupOptions {
  /** Called with the queue position (0 = running now) while the lookup waits. */
  onQueued?: (position: number) => void;
  /** Returns true once the result is no longer wanted (e.g. a newer search). */
  isCancelled?: () => boolean;
  /** Waits for ms; replaceable in tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Current time in ms; replaceable in tests. */
  now?: () => number;
  /** Total time to keep retrying. */
  retryLimitMs?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetches url, asking again while the backend answers 202 (queued).
 * Returns the last response, which is still 202 if the retry limit ran out,
 * or null when cancelled.
 */
export async function fetchWithQueue(url: string, options: QueuedLookupOptions = {}): Promise<Response | null> {
  const { onQueued, isCancelled = () => false, sleep = defaultSleep, now = Date.now, retryLimitMs = QUEUE_RETRY_LIMIT_MS } = options;

  let res = await fetch(url);
  const giveUpAt = now() + retryLimitMs;
  while (res.status === 202 && now() < giveUpAt) {
    const body = await res.json().catch(() => ({}));
    onQueued?.(Number(body.position) || 0);
    const retryAfter = Number(body.retry_after) || DEFAULT_RETRY_AFTER_S;
    await sleep(retryAfter * 1000);
    if (isCancelled()) return null;
    res = await fetch(url);
  }
  return isCancelled() ? null : res;
}

/** Thai status line shown while a lookup is queued. */
export function queueMessage(position: number): string {
  return position > 0
    ? `กำลังดึงข้อมูลจากระบบคณะ (คิวที่ ${position})…`
    : 'กำลังดึงข้อมูลจากระบบคณะ…';
}

/** Error message from a JSON error body (`{"error": "..."}`), or fallback. */
export async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return typeof body?.error === 'string' && body.error ? body.error : fallback;
}
