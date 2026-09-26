import { NextResponse, type NextRequest } from 'next/server';

const FORWARDED_PREFIXES = ['/api/', '/room/image/'];

/**
 * Forwards backend routes to the Go API so the browser only ever talks to
 * this origin (no CORS, and calendar feed links stay on the site's domain).
 * BACKEND_URL is read per request, so one build works in every environment.
 */
export function proxy(request: NextRequest) {
  const backend = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const { pathname, search } = request.nextUrl;
  const target = new URL(`${backend}${pathname}${search}`);

  // URL parsing resolves encoded dot segments ("/api/%2e%2e/x" -> "/x");
  // refuse anything that no longer targets a forwarded backend route.
  if (target.origin !== new URL(backend).origin || !FORWARDED_PREFIXES.some((prefix) => target.pathname.startsWith(prefix))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/api/:path*', '/room/image/:path*'],
};
