import { describe, expect, it } from 'vitest';
import { buildSubjectMap, countSeats, layoutSeatIds } from '@/lib/seatLayout';
import type { ExamResult, RoomConfig } from '@/types';

const config: RoomConfig = {
  layout: [
    { type: 'column', items: [{ type: 'seats', char: 'A', count: 3 }, { type: 'gap' }, { type: 'seats', char: 'A', count: 2 }] },
    { type: 'aisle', width: 1 },
    { type: 'column', items: [{ type: 'seats', char: 'B', manual: [5, 7] }, { type: 'seats', char: 'C', count: 2, start: 10, step: -1 }] },
  ],
};

describe('seat layout helpers', () => {
  it('counts every drawn seat', () => {
    expect(countSeats(config)).toBe(9);
    expect(countSeats(null)).toBe(0);
  });

  it('numbers auto runs continuously per row letter', () => {
    expect([...layoutSeatIds(config)].sort()).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'B5', 'B7', 'C10', 'C9'].sort());
  });

  it('colors subjects by sorted code and counts their seats', () => {
    const roster = [
      { subject: 'CP2', subject_name: 'Two', seat: 'A1' },
      { subject: 'CP1', subject_name: '', seat: 'A2' },
      { subject: 'CP1', subject_name: 'One', seat: 'A3' },
    ] as ExamResult[];
    const map = buildSubjectMap(roster);
    expect(Object.keys(map)).toEqual(['CP1', 'CP2']);
    expect(map.CP1).toMatchObject({ name: 'One', count: 2 });
    expect(map.CP2.count).toBe(1);
    expect(map.CP1.color).not.toEqual(map.CP2.color);
  });
});
