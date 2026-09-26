'use client';

import { useEffect, useState } from 'react';
import { Hourglass } from '@/components/icons';
import { examStartTime, findNextExam, formatCountdown } from '@/lib/utils';
import type { ExamResult } from '@/types';

/** Highlights the student's next (or ongoing) exam with a live countdown. */
export function NextExamBanner({ exams }: { exams: ExamResult[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const next = findNextExam(exams, now);
  const start = next ? examStartTime(next.date, next.time) : null;
  if (!next || !start) return null;

  const pendingSeat = !next.seat || next.seat === next.room;

  return (
    <div
      role="status"
      className="w-full rounded-2xl border border-faculty/20 dark:border-blue-900/60 bg-faculty-light/70 dark:bg-blue-950/40 px-4 py-3.5 flex items-center gap-3.5 animate-in fade-in duration-300"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-faculty text-white flex items-center justify-center shadow-sm shadow-faculty/25 dark:shadow-none">
        <Hourglass className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xxs font-black uppercase tracking-wider text-faculty dark:text-blue-300 leading-none">
          สอบถัดไป · {formatCountdown(start.getTime() - now)}
        </div>
        <div className="mt-1.5 text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
          {next.subject_name || next.subject}
        </div>
        <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
          {next.date} · {next.time} · {next.room}
          {!pendingSeat && <> · ที่นั่ง <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{next.seat}</span></>}
        </div>
      </div>
    </div>
  );
}
