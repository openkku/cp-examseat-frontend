'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSetSearchParams } from '@/hooks/useSetSearchParams';
import { apiUrl } from '@/lib/api';
import type { ExamResult, RoomConfigMap } from '@/types';

export interface RoundOption {
  id: string;
  label: string;
}

/** A fetched value tagged with the inputs it was fetched for. */
interface Keyed<T> {
  key: string;
  value: T;
}

const NONE: string[] = [];
const NO_EXAMS: ExamResult[] = [];

class NotFoundError extends Error {}

async function fetchJSON<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(apiUrl(path), { signal });
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

/** Keeps current when it is still offered, otherwise falls back to the first option. */
function keepOrFirst(current: string, options: string[]): string {
  return options.includes(current) ? current : (options[0] ?? '');
}

function readStoredRound(): string {
  try {
    return localStorage.getItem('selected_round') || '';
  } catch {
    return '';
  }
}

/**
 * Cascading round -> date -> time -> room filters of the room explorer, the
 * roster of the chosen slot, and the selected seat, synced to the URL.
 *
 * Each fetched list is stored with the inputs it belongs to, so changing a
 * filter hides the stale list immediately without clearing state inside an
 * effect, and late responses for old inputs are aborted.
 */
export function useExplorerFilters() {
  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  // The URL decides the initial selection; cascades keep it while valid.
  const [round, setRound] = useState(() => searchParams.get('round') ?? '');
  const [date, setDate] = useState(() => searchParams.get('date') ?? '');
  const [time, setTime] = useState(() => searchParams.get('time') ?? '');
  const [room, setRoom] = useState(() => searchParams.get('room') ?? '');
  const [selectedSeat, setSelectedSeat] = useState<ExamResult | null>(null);
  const pendingSeat = useRef(searchParams.get('seat'));

  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [configs, setConfigs] = useState<RoomConfigMap>({});
  const [dates, setDates] = useState<Keyed<string[]>>({ key: '', value: NONE });
  const [times, setTimes] = useState<Keyed<string[]>>({ key: '', value: NONE });
  const [rooms, setRooms] = useState<Keyed<string[]>>({ key: '', value: NONE });
  const [roster, setRoster] = useState<Keyed<ExamResult[]>>({ key: '', value: NO_EXAMS });
  const [ready, setReady] = useState(false);

  const datesKey = round;
  const timesKey = `${round}|${date}`;
  const roomsKey = `${round}|${date}|${time}`;
  const rosterKey = `${round}|${room}|${date}|${time}`;

  const optDates = round && dates.key === datesKey ? dates.value : NONE;
  const optTimes = round && date && times.key === timesKey ? times.value : NONE;
  const optRooms = round && date && time && rooms.key === roomsKey ? rooms.value : NONE;
  const hasSlot = Boolean(round && room && date && time);
  const scheduleData = hasSlot && roster.key === rosterKey ? roster.value : NO_EXAMS;
  const loading = hasSlot && roster.key !== rosterKey;

  // 1. Room layouts and rounds, once.
  useEffect(() => {
    const ac = new AbortController();
    fetchJSON<RoomConfigMap>('/api/room', ac.signal)
      .then(setConfigs)
      .catch((err) => { if (!isAbort(err)) console.error(err); });

    fetchJSON<RoundOption[]>('/api/rounds', ac.signal)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRounds(list);
        const ids = list.map((r) => r.id);
        setRound((current) => {
          const chosen = ids.includes(current) ? current : keepOrFirst(readStoredRound(), ids);
          try {
            if (chosen) localStorage.setItem('selected_round', chosen);
          } catch {
            // Storage unavailable: the choice just is not remembered.
          }
          return chosen;
        });
      })
      .catch((err) => { if (!isAbort(err)) console.error(err); });
    return () => ac.abort();
  }, []);

  // 2. Round -> dates
  useEffect(() => {
    if (!round) return;
    const ac = new AbortController();
    fetchJSON<string[]>(`/api/options?type=dates&round=${encodeURIComponent(round)}`, ac.signal)
      .catch((err) => { if (err instanceof NotFoundError) return NONE; throw err; })
      .then((data) => {
        const list = Array.isArray(data) ? data : NONE;
        setDates({ key: round, value: list });
        setDate((current) => keepOrFirst(current, list));
      })
      .catch((err) => { if (!isAbort(err)) console.error(err); });
    return () => ac.abort();
  }, [round]);

  // 3. Date -> times. With no times for the date, fall back to the first date.
  useEffect(() => {
    if (!round || !date) return;
    const key = `${round}|${date}`;
    const ac = new AbortController();
    fetchJSON<string[]>(`/api/options?type=times&round=${encodeURIComponent(round)}&date=${encodeURIComponent(date)}`, ac.signal)
      .then((data) => {
        const list = Array.isArray(data) ? data : NONE;
        setTimes({ key, value: list });
        setTime((current) => keepOrFirst(current, list));
      })
      .catch((err) => {
        if (err instanceof NotFoundError) {
          setTimes({ key, value: NONE });
          setTime('');
          if (optDates.length > 0 && optDates[0] !== date) setDate(optDates[0]);
        } else if (!isAbort(err)) {
          console.error(err);
        }
      });
    return () => ac.abort();
  }, [round, date, optDates]);

  // 4. Time -> rooms. With no rooms for the slot, try another time, then another date.
  useEffect(() => {
    if (!round || !date || !time) return;
    const key = `${round}|${date}|${time}`;
    const ac = new AbortController();
    fetchJSON<string[]>(`/api/options?type=rooms&round=${encodeURIComponent(round)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`, ac.signal)
      .then((data) => {
        const list = Array.isArray(data) ? data : NONE;
        setRooms({ key, value: list });
        setRoom((current) => keepOrFirst(current, list));
      })
      .catch((err) => {
        if (err instanceof NotFoundError) {
          setRooms({ key, value: NONE });
          setRoom('');
          const nextTime = optTimes.find((t) => t !== time);
          const nextDate = optDates.find((d) => d !== date);
          if (optTimes.length > 1 && nextTime) setTime(nextTime);
          else if (optDates.length > 1 && nextDate) setDate(nextDate);
        } else if (!isAbort(err)) {
          console.error(err);
        }
      });
    return () => ac.abort();
  }, [round, date, time, optTimes, optDates]);

  // 5. Slot -> roster. A seat from the URL is selected once its roster loads.
  useEffect(() => {
    if (!round || !room || !date || !time) return;
    const key = `${round}|${room}|${date}|${time}`;
    const ac = new AbortController();
    const params = new URLSearchParams({ round, room, date, time });
    fetchJSON<ExamResult[]>(`/api/explore?${params}`, ac.signal)
      .catch((err) => { if (err instanceof NotFoundError) return NO_EXAMS; throw err; })
      .then((data) => {
        const list = Array.isArray(data) ? data : NO_EXAMS;
        setRoster({ key, value: list });
        if (pendingSeat.current) {
          const found = list.find((s) => s.seat === pendingSeat.current);
          if (found) setSelectedSeat(found);
          pendingSeat.current = null;
        }
        setReady(true);
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setRoster({ key, value: NO_EXAMS });
        setReady(true);
      });
    return () => ac.abort();
  }, [round, room, date, time]);

  // 6. Mirror the selection into the URL (shareable links).
  useEffect(() => {
    if (!ready) return;
    const params: Record<string, string> = {};
    if (round) params.round = round;
    if (date) params.date = date;
    if (time) params.time = time;
    if (room) params.room = room;
    if (selectedSeat?.seat) params.seat = selectedSeat.seat;
    setSearchParams(params, { replace: true });
  }, [round, date, time, room, selectedSeat, setSearchParams, ready]);

  const choose = useCallback((setter: (v: string) => void) => (value: string) => {
    setter(value);
    setSelectedSeat(null);
  }, []);

  /** Shows the slot and seat of an exam (e.g. a search result). */
  const jumpTo = useCallback((exam: ExamResult) => {
    setDate(exam.date);
    setTime(exam.time);
    setRoom(exam.room);
    setSelectedSeat(exam);
  }, []);

  return {
    rounds,
    configs,
    optDates,
    optTimes,
    optRooms,
    round,
    date,
    time,
    room,
    setRound: choose(setRound),
    setDate: choose(setDate),
    setTime: choose(setTime),
    setRoom: choose(setRoom),
    scheduleData,
    loading,
    selectedSeat,
    setSelectedSeat,
    jumpTo,
  };
}
