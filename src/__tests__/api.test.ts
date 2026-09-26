import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadApi(baseUrl?: string) {
  vi.resetModules();
  if (baseUrl === undefined) {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
  } else {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', baseUrl);
  }
  return import('@/lib/api');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('api helpers (same-origin proxy mode)', () => {
  it('keeps backend paths on this origin', async () => {
    const api = await loadApi();
    expect(api.apiUrl('/api/rounds')).toBe('/api/rounds');
    expect(api.assetUrl('/room/image/CP.9127.jpg')).toBe('/room/image/CP.9127.jpg');
  });

  it('builds absolute calendar feed and webcal URLs from the page origin', async () => {
    const api = await loadApi();
    const origin = window.location.origin;
    expect(api.calendarFeedUrl('653380123-4')).toBe(`${origin}/api/calendar/653380123-4.ics`);
    expect(api.calendarSubscribeUrl('653380123-4')).toBe(`${origin.replace(/^https?:/, 'webcal:')}/api/calendar/653380123-4.ics`);
  });
});

describe('api helpers (direct backend mode)', () => {
  it('prefixes backend paths and relative assets with NEXT_PUBLIC_API_BASE_URL', async () => {
    const api = await loadApi('https://api.example.test/');
    expect(api.apiUrl('/api/rounds')).toBe('https://api.example.test/api/rounds');
    expect(api.assetUrl('/room/image/a.jpg')).toBe('https://api.example.test/room/image/a.jpg');
    expect(api.assetUrl('https://cdn.example.test/a.jpg')).toBe('https://cdn.example.test/a.jpg');
    expect(api.assetUrl(undefined)).toBeUndefined();
    expect(api.calendarSubscribeUrl('6533801234')).toBe('webcal://api.example.test/api/calendar/6533801234.ics');
  });
});
