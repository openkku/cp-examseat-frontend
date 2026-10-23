import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, fetchWithQueue, queueMessage } from '@/lib/examLookup';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWithQueue', () => {
  it('asks again while the lookup is queued', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(202, { queued: true, position: 3, retry_after: 2 }))
      .mockResolvedValueOnce(json(202, { queued: true, position: 1, retry_after: 2 }))
      .mockResolvedValueOnce(json(200, [{ seat: 'B51' }]));
    vi.stubGlobal('fetch', fetchMock);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const positions: number[] = [];

    const res = await fetchWithQueue('/api/exam?id=1&round=r', { sleep, onQueued: (p) => positions.push(p) });

    expect(res?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(positions).toEqual([3, 1]);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('gives up after the retry limit and returns the queued response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => json(202, { queued: true, position: 9 })));
    let t = 0;
    const res = await fetchWithQueue('/x', {
      sleep: async (ms) => { t += ms; },
      now: () => t,
      retryLimitMs: 12_000,
    });
    expect(res?.status).toBe(202);
    expect(t).toBe(15_000); // three default 5s waits
  });

  it('returns null once a newer search cancels it', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json(202, { queued: true, position: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchWithQueue('/x', { sleep: async () => {}, isCancelled: () => true });
    expect(res).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('passes other answers straight through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(404, { error: 'No exam schedules found' })));
    const res = await fetchWithQueue('/x');
    expect(res?.status).toBe(404);
  });
});

describe('queue helpers', () => {
  it('formats the queue position', () => {
    expect(queueMessage(3)).toContain('คิวที่ 3');
    expect(queueMessage(0)).not.toContain('คิว');
  });

  it('reads the backend error message', async () => {
    expect(await errorMessage(json(429, { error: 'ช้าลงหน่อย' }), 'fallback')).toBe('ช้าลงหน่อย');
    expect(await errorMessage(new Response('<html>', { status: 502 }), 'fallback')).toBe('fallback');
  });
});
