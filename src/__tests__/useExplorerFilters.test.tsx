import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamResult } from '@/types';

let urlParams = new URLSearchParams();
vi.mock('next/navigation', () => ({ useSearchParams: () => urlParams }));

import { useExplorerFilters } from '@/views/explorer/useExplorerFilters';

const exam = (seat: string, extra: Partial<ExamResult> = {}): ExamResult => ({
  sheet: 'S', date: '2026-09-01', time: '08.30-11.30', room: 'CP.9127', subject: 'CP1',
  section: '1', student_id: '1', seat, note: '', ...extra,
});

// A tiny fake backend keyed by path + query.
const routes: Record<string, unknown> = {
  '/api/room': {},
  '/api/rounds': [{ id: 'mid', label: 'Mid' }, { id: 'final', label: 'Final' }],
  '/api/options?type=dates&round=mid': ['2026-09-01', '2026-09-02'],
  '/api/options?type=times&round=mid&date=2026-09-01': ['08.30-11.30', '13.00-16.00'],
  '/api/options?type=times&round=mid&date=2026-09-02': ['13.00-16.00'],
  '/api/options?type=rooms&round=mid&date=2026-09-01&time=08.30-11.30': ['CP.9127', 'SC.1101'],
  '/api/options?type=rooms&round=mid&date=2026-09-02&time=13.00-16.00': ['SC.1101'],
  // No rooms at 13.00 on the 1st: the hook must fall back to another time.
  '/api/explore?round=mid&room=CP.9127&date=2026-09-01&time=08.30-11.30': [exam('A1'), exam('A2')],
  '/api/explore?round=mid&room=SC.1101&date=2026-09-01&time=08.30-11.30': [exam('B1', { room: 'SC.1101' })],
  '/api/explore?round=mid&room=SC.1101&date=2026-09-02&time=13.00-16.00': [exam('C1', { room: 'SC.1101', date: '2026-09-02', time: '13.00-16.00' })],
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/explorer');
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const url = new URL(input, 'http://site.test');
    const key = url.pathname + url.search;
    if (!(key in routes)) return new Response('{"error":"not found"}', { status: 404 });
    return new Response(JSON.stringify(routes[key]), { status: 200 });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useExplorerFilters', () => {
  it('cascades to the first valid option for each filter and loads the roster', async () => {
    urlParams = new URLSearchParams();
    const { result } = renderHook(() => useExplorerFilters());

    await waitFor(() => expect(result.current.scheduleData).toHaveLength(2));
    expect(result.current).toMatchObject({ round: 'mid', date: '2026-09-01', time: '08.30-11.30', room: 'CP.9127' });
    expect(result.current.optRooms).toEqual(['CP.9127', 'SC.1101']);
    expect(window.location.search).toBe('?round=mid&date=2026-09-01&time=08.30-11.30&room=CP.9127');
    expect(localStorage.getItem('selected_round')).toBe('mid');
  });

  it('restores the selection and seat from the URL', async () => {
    urlParams = new URLSearchParams('round=mid&date=2026-09-01&time=08.30-11.30&room=SC.1101&seat=B1');
    const { result } = renderHook(() => useExplorerFilters());

    await waitFor(() => expect(result.current.selectedSeat?.seat).toBe('B1'));
    expect(result.current.room).toBe('SC.1101');
    expect(window.location.search).toContain('seat=B1');
  });

  it('falls back to another time when a slot has no rooms', async () => {
    urlParams = new URLSearchParams('round=mid&date=2026-09-01&time=13.00-16.00');
    const { result } = renderHook(() => useExplorerFilters());

    await waitFor(() => expect(result.current.scheduleData).toHaveLength(2));
    expect(result.current.time).toBe('08.30-11.30');
  });

  it('jumps to an exam and hides stale data while the new slot loads', async () => {
    urlParams = new URLSearchParams();
    const { result } = renderHook(() => useExplorerFilters());
    await waitFor(() => expect(result.current.scheduleData).toHaveLength(2));

    const target = exam('C1', { room: 'SC.1101', date: '2026-09-02', time: '13.00-16.00' });
    act(() => result.current.jumpTo(target));

    // Old roster is not shown for the new slot.
    expect(result.current.scheduleData).toHaveLength(0);
    await waitFor(() => expect(result.current.scheduleData.map((s) => s.seat)).toEqual(['C1']));
    expect(result.current).toMatchObject({ date: '2026-09-02', time: '13.00-16.00', room: 'SC.1101' });
    expect(result.current.selectedSeat?.seat).toBe('C1');
  });

  it('clears the selected seat when a filter changes', async () => {
    urlParams = new URLSearchParams('round=mid&date=2026-09-01&time=08.30-11.30&room=CP.9127&seat=A1');
    const { result } = renderHook(() => useExplorerFilters());
    await waitFor(() => expect(result.current.selectedSeat?.seat).toBe('A1'));

    act(() => result.current.setRoom('SC.1101'));
    expect(result.current.selectedSeat).toBeNull();
    await waitFor(() => expect(result.current.scheduleData.map((s) => s.seat)).toEqual(['B1']));
  });
});
