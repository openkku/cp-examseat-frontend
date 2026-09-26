import { render } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExamCard } from '@/components/exam/ExamCard';
import { safeExternalUrl } from '@/lib/api';
import { config as proxyConfig, proxy } from '@/proxy';
import nextConfig from '../../next.config';
import type { ExamResult } from '@/types';

afterEach(() => {
  vi.unstubAllEnvs();
});

function rewriteTarget(path: string): URL {
  const res = proxy(new NextRequest(new URL(path, 'http://site.test')));
  const target = res.headers.get('x-middleware-rewrite');
  expect(target, `no rewrite for ${path}`).toBeTruthy();
  return new URL(target!);
}

describe('proxy', () => {
  it('only ever forwards to BACKEND_URL, whatever the path', () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.internal:8080/');

    for (const path of [
      '/api/rounds',
      '/api/exam?id=1&round=x',
      '/api/@evil.example/x',
      '/api//evil.example/x',
      '/api/..%2f..%2fadmin',
      '/api/%2e%2e/%2e%2e/etc/passwd',
      '/api/x?next=http://evil.example',
      '/room/image/..%2f..%2fexams.db',
    ]) {
      const res = proxy(new NextRequest(new URL(path, 'http://site.test')));
      const rewrite = res.headers.get('x-middleware-rewrite');
      if (!rewrite) {
        expect(res.status, `${path} was neither forwarded nor refused`).toBe(404);
        continue;
      }
      const target = new URL(rewrite);
      expect(target.origin, path).toBe('http://backend.internal:8080');
      expect(target.pathname.startsWith('/api/') || target.pathname.startsWith('/room/image/'), `${path} -> ${target.pathname}`).toBe(true);
    }
  });

  it('refuses encoded dot segments that climb out of /api', () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.internal:8080');
    for (const path of ['/api/%2e%2e/%2e%2e/etc/passwd', '/api/%2E%2E/healthz', '/room/image/%2e%2e/%2e%2e/healthz']) {
      const res = proxy(new NextRequest(new URL(path, 'http://site.test')));
      expect(res.headers.get('x-middleware-rewrite'), path).toBeNull();
      expect(res.status, path).toBe(404);
    }
  });

  it('keeps the query string intact', () => {
    vi.stubEnv('BACKEND_URL', 'http://backend.internal:8080');
    expect(rewriteTarget('/api/explore?round=a&room=CP.9127').search).toBe('?round=a&room=CP.9127');
  });

  it('only matches backend routes', () => {
    expect(proxyConfig.matcher).toEqual(['/api/:path*', '/room/image/:path*']);
  });
});

describe('rendering untrusted exam data', () => {
  const payload = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';
  const exam: ExamResult = {
    sheet: payload,
    date: '2026-09-01',
    time: '08.30-11.30',
    room: payload,
    subject: payload,
    subject_name: payload,
    section: payload,
    student_id: '6533801234',
    seat: payload,
    note: payload,
    labels: [payload],
  };

  it('renders HTML in API fields as text, never as markup', () => {
    const { container } = render(<ExamCard data={exam} configMap={{}} subjectName={payload} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img[onerror]')).toBeNull();
    expect(container.textContent).toContain('<script>');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});

describe('safeExternalUrl', () => {
  it('allows http(s) and site-relative links', () => {
    expect(safeExternalUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(safeExternalUrl('http://example.test/x')).toBe('http://example.test/x');
    expect(safeExternalUrl('/room#room-cp.9127')).toBe('/room#room-cp.9127');
  });

  it('drops script and data URLs from API data', () => {
    for (const url of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', '//evil.example/x']) {
      expect(safeExternalUrl(url), url).toBeUndefined();
    }
    expect(safeExternalUrl(undefined)).toBeUndefined();
    expect(safeExternalUrl('')).toBeUndefined();
  });
});

describe('security headers', () => {
  it('are sent on every route', async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === '/:path*');
    const headers = Object.fromEntries(all!.headers.map((h) => [h.key, h.value]));
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('does not advertise the framework', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
