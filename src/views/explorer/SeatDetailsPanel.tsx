'use client';

import { Badge } from '@/components/ui/Badge';
import { ExternalLink, Info, User } from '@/components/icons';
import { formatBranch } from '@/lib/utils';
import type { ExamResult } from '@/types';

interface SeatDetailsPanelProps {
  selectedSeat: ExamResult | null;
  setSelectedSeat: (seat: ExamResult | null) => void;
  /** Whether the selected seat is drawn on the room layout. */
  isOnLayout: boolean;
}

const getSubjectName = (exam: ExamResult) => exam.subject_name || exam.subject;

/** Bottom sheet (mobile) / side panel (desktop) describing the selected seat. */
export function SeatDetailsPanel({ selectedSeat, setSelectedSeat, isOnLayout }: SeatDetailsPanelProps) {
  return (
    <>
      {/* Mobile Backdrop for Student Details Sheet */}
      {selectedSeat && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setSelectedSeat(null)}
        />
      )}

      {/* Responsive Drawer Bottom Sheet / Desktop Details Panel (Sleek slides) */}
      <div className={`fixed md:absolute z-40 md:z-20
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[55vh] md:max-h-none border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/80
        md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-72 md:rounded-none
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl dark:shadow-none flex flex-col
        transition-transform duration-300 ease-in-out
        ${selectedSeat ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
      `}>

        {/* Drag handle for mobile */}
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-850 rounded-full mx-auto my-3 shrink-0 md:hidden" />

        {/* Details Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <h3 className="font-black text-slate-750 dark:text-slate-350 text-xs uppercase tracking-wider flex items-center gap-1.5 leading-none">
            <User className="w-4 h-4 text-blue-600" />
            รายละเอียดการสอบ
          </h3>
          <button
            onClick={() => setSelectedSeat(null)}
            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer outline-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Details Body */}
        {selectedSeat && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">

            {/* Warnings / Notes */}
            {!isOnLayout && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wide leading-none">
                  <Info className="w-3.5 h-3.5" />
                  <span>ไม่พบตำแหน่งที่นั่งบนผัง</span>
                </div>
                <div className="text-amber-900 dark:text-amber-300 font-semibold text-xs leading-relaxed">
                  ที่นั่งหมายเลข <span className="font-mono font-bold text-amber-600 dark:text-amber-450 bg-amber-100/50 dark:bg-amber-950/40 px-1 rounded">{selectedSeat.seat}</span> ไม่แสดงบนแผนผังที่นั่ง
                </div>
              </div>
            )}

            {selectedSeat.note && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wide leading-none">
                  <Info className="w-3.5 h-3.5" />
                  <span>หมายเหตุ</span>
                </div>
                <div className="text-amber-900 dark:text-amber-300 font-semibold text-xs leading-relaxed">
                  {selectedSeat.note}
                </div>
              </div>
            )}

            {/* Seat Number */}
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">หมายเลขที่นั่ง</span>
              <div className={`text-5xl font-black tracking-tighter ${selectedSeat.note ? 'text-amber-500 dark:text-amber-400' : 'text-blue-600 dark:text-blue-450'}`}>
                {selectedSeat.seat || "-"}
              </div>
            </div>

             {/* Student ID Card */}
            <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl p-4 text-center relative overflow-hidden shadow-inner dark:shadow-none flex flex-col items-center justify-center gap-1.5">
              <div>
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1.5 block leading-none">รหัสนักศึกษา</span>
                <a
                  href={`/?id=${encodeURIComponent(selectedSeat.student_id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-mono font-black text-blue-900 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-4 flex items-center justify-center gap-1.5"
                  title="ดูตารางสอบทั้งหมดของ นศ. รายนี้"
                >
                  {selectedSeat.student_id}
                  <ExternalLink className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {selectedSeat.branch && (
                  <Badge variant="indigo" size="sm" className="font-extrabold uppercase font-sans tracking-wide">
                    {formatBranch(selectedSeat.branch)}
                  </Badge>
                )}
                {selectedSeat.labels && selectedSeat.labels.map((lbl, idx) => (
                  <Badge key={idx} variant="navy" size="sm" className="font-extrabold font-sans tracking-wide">
                    {lbl}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Subject Details */}
            <div className="space-y-4 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-5">
              <div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block leading-none">รายวิชา</span>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">{getSubjectName(selectedSeat)}</h4>
                <span className="font-mono text-slate-400 dark:text-slate-500 block mt-1 font-semibold">{selectedSeat.subject}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850 pt-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">กลุ่มเรียน</span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{selectedSeat.section || "-"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">แผ่นใบเซ็นชื่อ</span>
                  <span className="font-black text-slate-700 dark:text-slate-300 font-mono">{selectedSeat.sheet || "-"}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
