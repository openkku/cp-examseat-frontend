'use client';

import React, { useMemo, useState } from 'react';
import { SeatMap } from '@/components/room/SeatMap';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { ChevronDown, ChevronRight, MapPin } from '@/components/icons';
import { useExplorerPrefs } from '@/hooks/useExplorerPrefs';
import { buildSubjectMap, countSeats, layoutSeatIds } from '@/lib/seatLayout';
import { findRoomConfig } from '@/lib/utils';
import type { ExamResult } from '@/types';
import { DisplayPrefsButton } from '@/views/explorer/DisplayPrefsButton';
import { ExplorerSearch } from '@/views/explorer/ExplorerSearch';
import { ExplorerSidebar } from '@/views/explorer/ExplorerSidebar';
import { SeatDetailsPanel } from '@/views/explorer/SeatDetailsPanel';
import { useExplorerFilters } from '@/views/explorer/useExplorerFilters';

export const RoomExplorer: React.FC = () => {
  const {
    rounds: optRounds,
    configs,
    optDates,
    optTimes,
    optRooms,
    round,
    date,
    time,
    room,
    setRound,
    setDate,
    setTime,
    setRoom,
    scheduleData,
    selectedSeat,
    setSelectedSeat,
    jumpTo,
  } = useExplorerFilters();

  // Highlight and responsive drawer states
  const [highlightedSubject, setHighlightedSubject] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Seat cell display preferences
  const [prefs, setPrefs] = useExplorerPrefs();

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setHighlightedSubject(undefined);
  };

  const handleSelectSearchResult = (exam: ExamResult) => {
    setHighlightedSubject(undefined);
    jumpTo(exam);
  };

  const currentConfig = useMemo(() => (room ? findRoomConfig(room, configs) : null), [room, configs]);
  const totalSeatsCount = useMemo(() => countSeats(currentConfig), [currentConfig]);
  const validSeatIds = useMemo(() => layoutSeatIds(currentConfig), [currentConfig]);

  const occupiedSeats = useMemo(() => {
    const map: Record<string, ExamResult> = {};
    scheduleData.forEach((item) => { map[item.seat] = item; });
    return map;
  }, [scheduleData]);

  const orphanedSeats = useMemo(() => {
    if (!currentConfig || scheduleData.length === 0) return [];
    return scheduleData.filter((student) => !validSeatIds.has(student.seat));
  }, [scheduleData, validSeatIds, currentConfig]);

  const subjectMap = useMemo(() => buildSubjectMap(scheduleData), [scheduleData]);

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 text-sm overflow-hidden select-none transition-colors">

      {/* TOP DASHBOARD NAVIGATION BAR (Glassmorphic & Compact on Mobile) */}
      <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 z-30 backdrop-blur-xl px-4 sm:px-6 pt-2.5 sm:pt-4 pb-1 sm:pb-2 xl:pb-4 transition-all duration-300 select-none shrink-0">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">

          {/* Title Block */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="p-2 bg-teal-600 rounded-xl text-white shadow-sm shadow-teal-600/20 shrink-0 hidden sm:flex">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2 truncate">
                สำรวจห้องสอบ
                {room && (
                  <Badge variant="blue" size="sm" className="font-extrabold font-mono">
                    {room}
                  </Badge>
                )}
              </h1>
              <p className="text-xxs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
              </p>
            </div>
          </div>

          {/* Filters Toolbar Row */}
          <div className={`flex-1 flex flex-wrap items-center gap-3 w-full justify-start xl:justify-end transition-all duration-300 ${isFiltersOpen ? 'opacity-100 max-h-[500px] visible' : 'opacity-0 max-h-0 overflow-hidden invisible xl:flex xl:opacity-100 xl:max-h-none xl:visible'
            }`}>
            {/* Round select */}
            <div className="w-full sm:w-44">
              <Select
                value={round}
                onChange={e => handleFilterChange(setRound, e.target.value)}
                className="w-full select-xs"
              >
                {optRounds.length === 0 && <option>Loading...</option>}
                {optRounds.map(r => <option key={r.id} value={r.id}>{r.label.replace('Exam ', '')}</option>)}
              </Select>
            </div>

            {/* Date and Time selectors group */}
            <div className="w-full flex gap-3 sm:w-auto">
              {/* Date select */}
              <div className="flex-1 sm:w-36 sm:flex-none">
                <Select
                  value={date}
                  onChange={e => handleFilterChange(setDate, e.target.value)}
                  disabled={optDates.length === 0}
                >
                  {optDates.length === 0 && <option value="">Select Date</option>}
                  {optDates.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>

              {/* Time select */}
              <div className="flex-1 sm:w-32 sm:flex-none">
                <Select
                  value={time}
                  onChange={e => handleFilterChange(setTime, e.target.value)}
                  disabled={optTimes.length === 0}
                >
                  {optTimes.length > 0 ? optTimes.map(t => <option key={t} value={t}>{t}</option>) : <option>--:--</option>}
                </Select>
              </div>
            </div>

            {/* Room select */}
            <div className="w-full sm:w-32">
              <Select
                value={room}
                onChange={e => handleFilterChange(setRoom, e.target.value)}
                disabled={optRooms.length === 0}
              >
                {optRooms.length > 0 ? optRooms.map(r => <option key={r} value={r}>{r}</option>) : <option>None</option>}
              </Select>
            </div>

            {/* Search & Preference Toggle Group */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              {/* Autocomplete Search input */}
              <ExplorerSearch round={round} onSelect={handleSelectSearchResult} />
              <DisplayPrefsButton prefs={prefs} setPrefs={setPrefs} />
            </div>

          </div>

        </div>

        {/* Mobile Pull-Down / Collapse Handle Bar */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="xl:hidden w-full flex items-center justify-center py-1 mt-2 border-t border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-950/30 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-all duration-200 cursor-pointer outline-none"
          aria-label={isFiltersOpen ? "Collapse filters" : "Expand filters"}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      {/* MAP CANVAS & SIDEBARS */}
      <div className="flex-1 flex overflow-hidden relative">

        <ExplorerSidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          hasRoomLayout={Boolean(currentConfig && room)}
          totalSeatsCount={totalSeatsCount}
          occupiedCount={scheduleData.length}
          orphanedSeats={orphanedSeats}
          subjectMap={subjectMap}
          highlightedSubject={highlightedSubject}
          setHighlightedSubject={setHighlightedSubject}
          setSelectedSeat={setSelectedSeat}
        />

        {/* Visual Seating Map viewport */}
        <div className="flex-1 relative h-full bg-slate-100/30 dark:bg-slate-950/20 flex flex-col z-0">

          {/* Floating Mobile Sidebar Trigger Button */}
          {!isMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-full shadow-xl text-slate-655 dark:text-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all z-20 cursor-pointer"
              title="Open Sidebar Drawer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {currentConfig && room ? (
            <SeatMap
              config={currentConfig}
              occupied={occupiedSeats}
              targetSeat={selectedSeat?.seat}
              onSeatClick={(seatId, data) => setSelectedSeat(data || null)}
              highlightedSubject={highlightedSubject}
              seatDisplayPrefs={prefs}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 flex-col gap-3.5 p-6 text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-md dark:shadow-none animate-bounce">🗺️</div>
              <div>
                <p className="font-black text-slate-700 dark:text-slate-350 text-base leading-none">โปรดเลือกห้องสอบ</p>
                <p className="text-xs text-slate-455 dark:text-slate-500 max-w-xs leading-relaxed mt-2.5 font-semibold">เลือกรายละเอียดรอบสอบ วัน เวลา และห้องสอบจากแถบด้านบน เพื่อจำลองผังที่นั่งในห้องสอบ</p>
              </div>
            </div>
          )}
        </div>

        <SeatDetailsPanel
          selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat}
          isOnLayout={selectedSeat ? validSeatIds.has(selectedSeat.seat) : true}
        />

      </div>

    </div>
  );
};
