'use client';

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { AlertTriangle, School } from '@/components/icons';
import type { SubjectInfo } from '@/lib/seatLayout';
import type { ExamResult } from '@/types';

interface ExplorerSidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  hasRoomLayout: boolean;
  totalSeatsCount: number;
  occupiedCount: number;
  orphanedSeats: ExamResult[];
  subjectMap: Record<string, SubjectInfo>;
  highlightedSubject: string | undefined;
  setHighlightedSubject: (subject: string | undefined) => void;
  setSelectedSeat: (seat: ExamResult) => void;
}

const getSubjectName = (exam: ExamResult) => exam.subject_name || exam.subject;

// Occupancy ring geometry
const radius = 30;
const circumference = 2 * Math.PI * radius;

/** Occupancy ring, seats missing from the layout, and the subject legend. */
export function ExplorerSidebar({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  hasRoomLayout,
  totalSeatsCount,
  occupiedCount,
  orphanedSeats,
  subjectMap,
  highlightedSubject,
  setHighlightedSubject,
  setSelectedSeat,
}: ExplorerSidebarProps) {
  const pct = totalSeatsCount > 0 ? Math.round((occupiedCount / totalSeatsCount) * 100) : 0;
  const animatedPct = useAnimatedNumber(pct);
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Panel (Redesigned: Analytics and legend list only) */}
      <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] md:max-w-none md:static md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/80 flex flex-col shrink-0 z-40 md:z-10 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 md:bg-transparent shrink-0">
          <h2 className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center gap-1.5 leading-none">
            <School className="w-4 h-4 text-blue-600" />
            อัตราการใช้ห้องสอบ
          </h2>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Room Occupancy Analytics (Circular SVG Widget) */}
          {hasRoomLayout ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/20 dark:border-slate-800/80 rounded-2xl p-4">
                {/* SVG Circular Progress */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                      strokeWidth="5"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="stroke-blue-600 fill-none transition-all duration-700 ease-out"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{animatedPct}%</span>
                    <span className="text-nano uppercase font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 leading-none">เต็ม</span>
                  </div>
                </div>

                {/* Summary counts */}
                <div className="flex-1 space-y-1.5 text-xs min-w-0 font-sans leading-none">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                    <span>ความจุ:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-250 font-mono">{totalSeatsCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                    <span>ใช้งาน:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{occupiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 mt-1">
                    <span>ว่าง:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{totalSeatsCount - occupiedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-3 text-slate-400 text-xxs italic bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
              ยังไม่ได้เลือกห้องสอบ
            </div>
          )}

          {/* Orphaned/Missing Seats Warning Alert Widget */}
          {orphanedSeats.length > 0 && (
            <div className="space-y-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-900/40 rounded-2xl p-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-400 font-black text-xxs uppercase tracking-wide leading-none">
                <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                <span>ที่นั่งไม่มีในผัง ({orphanedSeats.length})</span>
              </div>
              <p className="text-xxs text-rose-700 dark:text-rose-455 leading-normal font-semibold font-sans">
                พบข้อมูลที่นั่งในตารางสอบ แต่มองไม่เห็นในผังห้องสอบปัจจุบัน:
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {orphanedSeats.map((student) => (
                  <button
                    key={student.student_id}
                    onClick={() => setSelectedSeat(student)}
                    className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-rose-100/50 dark:border-rose-900/30 hover:border-rose-350 dark:hover:border-rose-800 hover:shadow-sm rounded-xl text-left transition-all text-xxs cursor-pointer outline-none active:scale-[0.98]"
                  >
                    <div className="flex flex-col leading-tight min-w-0 pr-2">
                      <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono text-xxs">{student.student_id}</span>
                      <span className="text-xxs text-slate-400 dark:text-slate-500 truncate max-w-[110px] font-semibold mt-0.5">{getSubjectName(student)}</span>
                    </div>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 px-1.5 py-0.5 rounded-lg shrink-0 text-xxs">
                      ที่นั่ง {student.seat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Subject Color Legend */}
          {Object.keys(subjectMap).length !== 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-1.5 shrink-0">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                  วิชาที่จัดสอบ ({Object.keys(subjectMap).length})
                </h3>
                {highlightedSubject && (
                  <button
                    onClick={() => setHighlightedSubject(undefined)}
                    className="text-xxs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline transition-colors leading-none cursor-pointer outline-none"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {Object.entries(subjectMap).map(([subj, info]) => {
                  const isHighlighted = highlightedSubject === subj;
                  const count = info.count;
                  return (
                    <button
                      key={subj}
                      onClick={() => setHighlightedSubject(isHighlighted ? undefined : subj)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer outline-none ${isHighlighted
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/80 ring-2 ring-blue-500/10 scale-[1.01] shadow-sm'
                        : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-150/50 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-lg shrink-0 ${info.color.bg} ${info.color.border} border`} />
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono text-xs">{subj}</span>
                          {info.name && <span className="text-xxs text-slate-400 dark:text-slate-500 truncate max-w-[110px] font-semibold mt-0.5">{info.name}</span>}
                        </div>
                      </div>
                      <span className={`text-xxs font-black px-2 py-0.5 rounded-full shrink-0 ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-455'
                        }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
