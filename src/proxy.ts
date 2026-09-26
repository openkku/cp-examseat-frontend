import { NextResponse, type NextRequest } from 'next/server';

/**
 * Forwards backend routes to the Go API so the browser only ever talks to
 * this origin (no CORS, and calendar feed links stay on the site's domain).
 * BACKEND_URL is read per request, so one build works in every environment.
 */
export function proxy(request: NextRequest) {
  const backend = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(`${backend}${pathname}${search}`));
}

export const config = {
  matcher: ['/api/:path*', '/room/image/:path*'],
};
