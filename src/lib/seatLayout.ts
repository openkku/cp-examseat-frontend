import { SEAT_PALETTE } from '@/lib/constants';
import type { ExamResult, RoomConfig } from '@/types';

/** Total number of seats drawn by a room layout. */
export function countSeats(config: RoomConfig | null): number {
  if (!config) return 0;
  let count = 0;
  for (const block of config.layout) {
    if (block.type !== 'column') continue;
    for (const item of block.items) {
      if (item.type !== 'seats') continue;
      if (item.manual) count += item.manual.length;
      else if (item.count) count += item.count;
    }
  }
  return count;
}

/**
 * Every seat ID ("A12") a layout draws. Auto-numbered runs continue from the
 * previous run of the same row letter unless they set an explicit start.
 */
export function layoutSeatIds(config: RoomConfig | null): Set<string> {
  const ids = new Set<string>();
  if (!config) return ids;

  const nextNumber: Record<string, number> = {};
  for (const block of config.layout) {
    if (block.type !== 'column') continue;
    for (const item of block.items) {
      if (item.type !== 'seats') continue;
      if (item.manual) {
        for (const num of item.manual) ids.add(`${item.char}${num}`);
        continue;
      }
      const step = item.step ?? (item.inverse ? -1 : 1);
      let current = item.start ?? (nextNumber[item.char] || 1);
      for (let i = 0; i < (item.count || 0); i++) {
        ids.add(`${item.char}${current}`);
        current += step;
      }
      nextNumber[item.char] = current;
    }
  }
  return ids;
}

export interface SubjectInfo {
  color: (typeof SEAT_PALETTE)[number];
  name: string;
  count: number;
}

/** Assigns each subject in a roster a palette color (by sorted code) and counts its seats. */
export function buildSubjectMap(roster: ExamResult[]): Record<string, SubjectInfo> {
  const bySubject = new Map<string, { name: string; count: number }>();
  for (const exam of roster) {
    const entry = bySubject.get(exam.subject) ?? { name: exam.subject_name || '', count: 0 };
    if (!entry.name && exam.subject_name) entry.name = exam.subject_name;
    entry.count++;
    bySubject.set(exam.subject, entry);
  }

  const map: Record<string, SubjectInfo> = {};
  [...bySubject.keys()].sort().forEach((subject, index) => {
    const { name, count } = bySubject.get(subject)!;
    map[subject] = { color: SEAT_PALETTE[index % SEAT_PALETTE.length], name, count };
  });
  return map;
}
