import type { NextConfig } from 'next';

// Applied to every page. The CSP only restricts what is safe to restrict
// without breaking the inline theme script, Google/Bunny fonts or map tiles.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (node server.js).
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // A first lookup of a checkex round can wait in the backend for up to 30s
    // (scrapler's queue); outlast it so the proxy does not cut it off.
    proxyTimeout: 45_000,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
