/**
 * Backend API access.
 *
 * By default the browser calls same-origin paths (`/api/*`, `/room/image/*`)
 * that `src/proxy.ts` forwards to the Go backend (`BACKEND_URL`). Set
 * `NEXT_PUBLIC_API_BASE_URL` at build time to call the backend directly
 * instead; the backend must then allow this site's origin through
 * `CORS_ALLOWED_ORIGINS`.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

/** URL of a backend path such as `/api/rounds`. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/** Resolves a root-relative asset URL returned by the backend (e.g. `/room/image/x.jpg`). */
export function assetUrl(url: string): string;
export function assetUrl(url: string | undefined): string | undefined;
export function assetUrl(url: string | undefined): string | undefined {
  return url && url.startsWith('/') && !url.startsWith('//') ? apiUrl(url) : url;
}

/** Absolute http(s) URL of a student's iCalendar feed (browser only). */
export function calendarFeedUrl(studentId: string): string {
  return new URL(apiUrl(`/api/calendar/${studentId}.ics`), window.location.href).toString();
}

/** webcal:// subscription URL of a student's iCalendar feed (browser only). */
export function calendarSubscribeUrl(studentId: string): string {
  return calendarFeedUrl(studentId).replace(/^https?:/, 'webcal:');
}
