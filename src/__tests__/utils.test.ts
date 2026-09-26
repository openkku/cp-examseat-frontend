import { describe, it, expect } from 'vitest';
import { parseSeat, findRoomConfig } from '@/lib/utils';
import type { RoomConfigMap } from '@/types';

describe('parseSeat', () => {
  it('correctly parses normal seats', () => {
    expect(parseSeat('A25')).toEqual({ char: 'A', num: 25 });
    expect(parseSeat('B1')).toEqual({ char: 'B', num: 1 });
  });

  it('correctly parses multi-character seats', () => {
    expect(parseSeat('AA12')).toEqual({ char: 'AA', num: 12 });
  });

  it('returns safe defaults for invalid/empty seats', () => {
    expect(parseSeat('')).toEqual({ char: '', num: -1 });
    expect(parseSeat('12')).toEqual({ char: '', num: -1 });
    expect(parseSeat('A')).toEqual({ char: '', num: -1 });
  });
});

describe('findRoomConfig', () => {
  const mockConfigMap: RoomConfigMap = {
    'CP.9127': { layout: [] },
    '^SC.5.*': { layout: [] },
    'SC.110[1-3]': { layout: [] },
  };

  it('finds direct match', () => {
    const config = findRoomConfig('CP.9127', mockConfigMap);
    expect(config).toBe(mockConfigMap['CP.9127']);
  });

  it('finds regex match', () => {
    const config = findRoomConfig('SC.5101', mockConfigMap);
    expect(config).toBe(mockConfigMap['^SC.5.*']);
  });

  it('finds regex range match', () => {
    const config = findRoomConfig('SC.1102', mockConfigMap);
    expect(config).toBe(mockConfigMap['SC.110[1-3]']);
  });

  it('returns null on mismatch', () => {
    const config = findRoomConfig('OTHER.ROOM', mockConfigMap);
    expect(config).toBeNull();
  });

  it('returns null on null/undefined config map', () => {
    expect(findRoomConfig('CP.9127', null as unknown as RoomConfigMap)).toBeNull();
  });
});

describe('getRoomContent', () => {
  it('prefers backend metadata over the built-in list', async () => {
    const { getRoomContent } = await import('@/lib/roomContent');
    const fromApi = getRoomContent('CP.9127', { title: 'API title', lat: 1, lng: 2 });
    expect(fromApi).toMatchObject({ title: 'API title', lat: 1, lng: 2 });
    expect(fromApi.description).toContain('วิทยวิภาส'); // built-in fills the gap
  });

  it('ignores an incomplete backend location', async () => {
    const { getRoomContent } = await import('@/lib/roomContent');
    const content = getRoomContent('cp.9127', { lat: 5 });
    expect(content.lat).toBeCloseTo(16.4756, 3);
  });

  it('falls back to a generic title for unknown rooms', async () => {
    const { getRoomContent } = await import('@/lib/roomContent');
    const content = getRoomContent('XX.1');
    expect(content.title).toBe('ห้องสอบ XX.1');
    expect(content.lat).toBeUndefined();
  });
});

describe('exam timing helpers', () => {
  it('reads the start time as Thailand time', async () => {
    const { examStartTime } = await import('@/lib/utils');
    expect(examStartTime('2026-09-01', '08.30-11.30')?.toISOString()).toBe('2026-09-01T01:30:00.000Z');
    expect(examStartTime('2026-09-01', '13:00 - 16:00')?.toISOString()).toBe('2026-09-01T06:00:00.000Z');
    expect(examStartTime('2026-09-01', '')).toBeNull();
    expect(examStartTime('1 ก.ย. 69', '08.30')).toBeNull();
  });

  it('formats a countdown in Thai', async () => {
    const { formatCountdown } = await import('@/lib/utils');
    const min = 60_000;
    expect(formatCountdown(-1)).toBe('กำลังสอบ');
    expect(formatCountdown(5 * min)).toBe('อีก 5 นาที');
    expect(formatCountdown(90 * min)).toBe('อีก 1 ชม. 30 นาที');
    expect(formatCountdown(120 * min)).toBe('อีก 2 ชม.');
    expect(formatCountdown((2 * 1440 + 3 * 60) * min)).toBe('อีก 2 วัน 3 ชม.');
    expect(formatCountdown(1440 * min)).toBe('อีก 1 วัน');
  });

  it('finds the next exam that has not ended', async () => {
    const { findNextExam } = await import('@/lib/utils');
    const now = Date.UTC(2030, 0, 10, 3, 0); // 10 Jan 2030, 10:00 in Bangkok
    const exams = [
      { id: 'later', date: '2030-01-12', time: '08.30-11.30' },
      { id: 'soon', date: '2030-01-11', time: '13.00-16.00' },
      { id: 'no-time', date: '2030-01-10', time: '' },
      { id: 'long-past', date: '2020-01-01', time: '08.30-11.30' },
    ];
    expect(findNextExam(exams, now)?.id).toBe('soon');
    expect(findNextExam([], now)).toBeNull();
  });
});
