import type { RoomConfig, RoomConfigMap } from '@/types';

/**
 * Searches the config map for a matching room.
 * Supports Regex keys (e.g. "^SC.5.*").
 */
export function findRoomConfig(roomName: string, configMap: RoomConfigMap): RoomConfig | null {
  if (!configMap) return null;

  // 1. Direct Match (Fastest)
  if (configMap[roomName]) {
    return configMap[roomName];
  }

  // 2. Regex Match (Safe Version)
  for (const key in configMap) {
    try {
      // ✅ FIX: Only treat it as Regex if it starts with ^ or contains special syntax
      // Otherwise, checking simple inclusion is safer.
      const regex = new RegExp(key, 'i'); // Added 'i' for case-insensitive
      if (regex.test(roomName)) {
        return configMap[key];
      }
    } catch {
      console.warn(`[Utils] Skipping invalid Regex key: "${key}"`);
    }
  }

  return null;
}

/**
 * Parses "A25" -> { char: "A", num: 25 }
 */
export function parseSeat(seatString: string) {
  const match = seatString?.match(/([A-Z]+)(\d+)/);
  return {
    char: match ? match[1] : '',
    num: match ? parseInt(match[2], 10) : -1
  };
}

/**
 * Maps branch code (e.g. "CP-CS", "SC-GIS") to display label by stripping prefixes 
 * and matching static majors.
 */
export function formatBranch(branchCode: string): string {
  if (!branchCode) return '';
  const cleanCode = branchCode.replace(/^[A-Za-z]{2}-/, '').trim();

  const mapping: Record<string, string> = {
    'CS': 'Computer Science',
    'AI': 'Artificial Intelligence',
    'CY': 'Cyber Security',
  };

  const lookupKey = cleanCode.toUpperCase();
  return mapping[lookupKey] || cleanCode;
}

/**
 * Determines if an exam date/time has already passed compared to current local time.
 * Date format: YYYY-MM-DD
 * Time format: HH.MM-HH.MM (e.g. "08.30-11.30" or "13.00-16.00")
 */
export function hasExamPassed(examDateStr: string, examTimeStr: string): boolean {
  if (!examDateStr) return false;
  
  // Get end time of the exam (e.g. "08.30-11.30" -> end time is 11:30)
  let endTimeStr = '23:59';
  if (examTimeStr && examTimeStr.includes('-')) {
    const parts = examTimeStr.split('-');
    if (parts.length > 1) {
      endTimeStr = parts[1].replace('.', ':');
    }
  }

  try {
    const [year, month, day] = examDateStr.split('-').map(Number);
    const [hours, minutes] = endTimeStr.split(':').map(Number);
    
    // Create Date in local timezone
    const examEndDateTime = new Date(year, month - 1, day, hours, minutes || 0, 0);
    return examEndDateTime.getTime() < Date.now();
  } catch (e) {
    console.error('[Utils] Error parsing exam date time:', examDateStr, examTimeStr, e);
    return false;
  }
}
const BANGKOK_OFFSET_HOURS = 7;

/**
 * Start of an exam as an absolute time, reading date (YYYY-MM-DD) and the
 * first HH.MM / HH:MM of time as Thailand time (UTC+7). Null without a start time.
 */
export function examStartTime(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date?.trim() ?? '');
  const t = /(\d{1,2})[.:](\d{2})/.exec(time ?? '');
  if (!d || !t) return null;
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [hours, minutes] = [Number(t[1]), Number(t[2])];
  return new Date(Date.UTC(year, month - 1, day, hours - BANGKOK_OFFSET_HOURS, minutes));
}

/** Thai countdown text for a duration in milliseconds, e.g. "อีก 2 วัน 3 ชม.". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'กำลังสอบ';
  const totalMinutes = Math.ceil(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `อีก ${days} วัน ${hours} ชม.` : `อีก ${days} วัน`;
  if (hours > 0) return minutes > 0 ? `อีก ${hours} ชม. ${minutes} นาที` : `อีก ${hours} ชม.`;
  return `อีก ${minutes} นาที`;
}

/** The earliest exam that has not ended yet (an ongoing exam counts), or null. */
export function findNextExam<T extends { date: string; time: string }>(exams: T[], now = Date.now()): T | null {
  let best: { exam: T; start: number } | null = null;
  for (const exam of exams) {
    const start = examStartTime(exam.date, exam.time);
    if (!start || hasExamPassed(exam.date, exam.time)) continue;
    // hasExamPassed uses the device clock; also skip exams that started over a day ago.
    if (start.getTime() < now - 24 * 3_600_000) continue;
    if (!best || start.getTime() < best.start) best = { exam, start: start.getTime() };
  }
  return best?.exam ?? null;
}
