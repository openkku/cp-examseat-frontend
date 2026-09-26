'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type SeatField =
  | 'seat'
  | 'subject'
  | 'subject_name'
  | 'student_id'
  | 'branch'
  | 'section'
  | 'sheet'
  | 'none';

export interface SeatDisplayPrefs {
  line1: Exclude<SeatField, 'none'>;
  line2: SeatField;
}

const STORAGE_KEY = 'explorer_seat_display';
const DEFAULT_PREFS: SeatDisplayPrefs = { line1: 'seat', line2: 'subject' };

const VALID_FIELDS: Set<string> = new Set([
  'seat',
  'subject',
  'subject_name',
  'student_id',
  'branch',
  'section',
  'sheet',
  'none',
]);

function parsePrefs(raw: string | null): SeatDisplayPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const line1 = VALID_FIELDS.has(parsed.line1) && parsed.line1 !== 'none' ? parsed.line1 : 'seat';
      const line2 = VALID_FIELDS.has(parsed.line2) ? parsed.line2 : 'subject';
      return { line1, line2 };
    }
  } catch (e) {
    console.error('[useExplorerPrefs] Error reading storage, using defaults:', e);
  }
  return DEFAULT_PREFS;
}

export function useExplorerPrefs(): [SeatDisplayPrefs, (p: SeatDisplayPrefs) => void] {
  const [raw, setRaw] = useLocalStorage(STORAGE_KEY);
  const prefs = useMemo(() => parsePrefs(raw), [raw]);
  const setPrefs = useCallback((newPrefs: SeatDisplayPrefs) => setRaw(JSON.stringify(newPrefs)), [setRaw]);
  return [prefs, setPrefs];
}
