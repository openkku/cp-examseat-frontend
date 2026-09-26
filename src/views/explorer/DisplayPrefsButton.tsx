'use client';

import { useEffect, useRef, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { SlidersHorizontal } from '@/components/icons';
import type { SeatDisplayPrefs, SeatField } from '@/hooks/useExplorerPrefs';

// Field labels for the seat display selector
const FIELD_META: Record<string, { label: string }> = {
  seat:         { label: 'หมายเลขที่นั่ง' },
  subject:      { label: 'รหัสวิชา' },
  subject_name: { label: 'ชื่อวิชา' },
  student_id:   { label: 'รหัส นศ.' },
  branch:       { label: 'สาขา' },
  section:      { label: 'กลุ่มเรียน' },
  sheet:        { label: 'แผ่นเซ็นชื่อ' },
  none:         { label: '(ว่าง)' },
};

const LINE1_OPTIONS = Object.entries(FIELD_META)
  .filter(([v]) => v !== 'none')
  .map(([value, m]) => ({ value, label: m.label }));
const LINE2_OPTIONS = Object.entries(FIELD_META)
  .map(([value, m]) => ({ value, label: m.label }));

interface DisplayPrefsButtonProps {
  prefs: SeatDisplayPrefs;
  setPrefs: (prefs: SeatDisplayPrefs) => void;
}

/** Popover choosing which two fields each seat cell shows. */
export function DisplayPrefsButton({ prefs, setPrefs }: DisplayPrefsButtonProps) {
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDisplayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsDisplayOpen(v => !v)}
        type="button"
        title="แสดงผลที่นั่ง"
        className={`shrink-0 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer h-[38px] w-[38px] flex items-center justify-center
          ${isDisplayOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        aria-label="แสดงผลที่นั่ง"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {/* Mobile Backdrop Blur Overlay */}
      {isDisplayOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 animate-in fade-in duration-200"
          onClick={() => setIsDisplayOpen(false)}
        />
      )}

      {/* Floating Glassmorphic Popover — responsively adapts to mobile floating bottom sheet */}
      {isDisplayOpen && (
        <div className="fixed bottom-4 left-4 right-4 sm:absolute sm:bottom-auto sm:right-0 sm:left-auto sm:top-full sm:mt-2 w-auto sm:w-[320px] z-30 rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-950/75 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xl shadow-black/20 dark:shadow-black/60 ring-1 ring-inset ring-white/30 dark:ring-white/[0.04] animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-1 duration-200 flex flex-col">

          {/* Drag handle for mobile */}
          <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700/60 rounded-full mx-auto my-3 shrink-0" />

          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-1 pb-3 sm:pt-3.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-tight leading-none">
              แสดงผลที่นั่ง
            </span>
          </div>

          {/* Gradient divider */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

          {/* Mirrored Select Inputs */}
          <div className="grid grid-cols-2 gap-3.5 px-4 py-4 sm:py-3.5">
            <Select
              label="บรรทัด 1"
              value={prefs.line1}
              onChange={e => setPrefs({ ...prefs, line1: e.target.value as Exclude<SeatField, 'none'> })}
              className="w-full text-xs font-bold font-sans"
            >
              {LINE1_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>

            <Select
              label="บรรทัด 2"
              value={prefs.line2}
              onChange={e => setPrefs({ ...prefs, line2: e.target.value as SeatField })}
              className="w-full text-xs font-bold font-sans"
            >
              {LINE2_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

        </div>
      )}
    </div>
  );
}
