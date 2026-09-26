import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSetSearchParams } from '@/hooks/useSetSearchParams';
import { useExplorerPrefs } from '@/hooks/useExplorerPrefs';

afterEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('useLocalStorage', () => {
  it('reads, writes and removes an entry, re-rendering subscribers', () => {
    localStorage.setItem('k', 'initial');
    const { result } = renderHook(() => useLocalStorage('k'));
    expect(result.current[0]).toBe('initial');

    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
    expect(localStorage.getItem('k')).toBe('next');

    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('k')).toBeNull();
  });
});

describe('useExplorerPrefs', () => {
  it('falls back to defaults for invalid stored preferences and persists updates', () => {
    localStorage.setItem('explorer_seat_display', JSON.stringify({ line1: 'none', line2: 'bogus' }));
    const { result } = renderHook(() => useExplorerPrefs());
    expect(result.current[0]).toEqual({ line1: 'seat', line2: 'subject' });

    act(() => result.current[1]({ line1: 'student_id', line2: 'none' }));
    expect(result.current[0]).toEqual({ line1: 'student_id', line2: 'none' });
    expect(JSON.parse(localStorage.getItem('explorer_seat_display')!)).toEqual({ line1: 'student_id', line2: 'none' });
  });
});

describe('useSetSearchParams', () => {
  it('replaces or pushes the query string, keeping the path and hash', () => {
    window.history.replaceState(null, '', '/explorer?round=a#top');
    const { result } = renderHook(() => useSetSearchParams());
    const before = window.history.length;

    act(() => result.current({ round: 'b', room: 'CP.9127' }, { replace: true }));
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/explorer?round=b&room=CP.9127#top');
    expect(window.history.length).toBe(before);

    act(() => result.current((prev) => {
      const next = new URLSearchParams(prev);
      next.set('seat', 'A1');
      return next;
    }));
    expect(window.location.search).toBe('?round=b&room=CP.9127&seat=A1');
    expect(window.history.length).toBe(before + 1);
  });
});
