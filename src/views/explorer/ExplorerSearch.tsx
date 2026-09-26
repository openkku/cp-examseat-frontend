'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Search, Trash2 } from '@/components/icons';
import { apiUrl } from '@/lib/api';
import type { ExamResult } from '@/types';

interface ExplorerSearchProps {
  round: string;
  /** Called with the exam the user picks from the results. */
  onSelect: (exam: ExamResult) => void;
}

const getSubjectName = (exam: ExamResult) => exam.subject_name || exam.subject;

/** Student ID search that jumps the explorer to one of the student's seats. */
export function ExplorerSearch({ round, onSelect }: ExplorerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExamResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !round) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowResults(true);

    try {
      const res = await fetch(apiUrl(`/api/exam?id=${encodeURIComponent(searchQuery)}&round=${encodeURIComponent(round)}`));
      if (res.status === 404) {
        setSearchResults([]);
        return;
      }
      if (!res.ok) throw new Error('Search failed');
      // /api/exam returns the student's exams as a plain array
      const data: ExamResult[] = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search failed', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (exam: ExamResult) => {
    if (exam.room === 'จัดสอบนอกตาราง') return;
    setShowResults(false);
    setSearchQuery('');
    onSelect(exam);
  };

  return (
    <div className="relative flex-1 sm:w-56" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative group">
        <Input
          type="text"
          placeholder="ค้นหารหัส นศ. ในห้องสอบนี้"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          disabled={!round}
          leftIcon={<Search className="h-4 w-4" />}
          className="py-2.5 text-xs font-mono"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setShowResults(false); }}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-200/50 hover:text-slate-655 transition-colors cursor-pointer animate-in fade-in"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Dropdown popup */}
      {showResults && (
        <Card className="absolute top-full mt-2 right-0 left-0 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {isSearching ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 leading-none">กำลังค้นหา...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[260px] overflow-y-auto">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 text-xxs font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest leading-none">
                พบผลการค้นหา {searchResults.length} รายการ
              </div>
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/40 cursor-pointer group transition-colors last:border-0"
                  onClick={() => selectSearchResult(res)}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">{getSubjectName(res)}</span>
                    <Badge variant="slate" size="sm" className="font-extrabold font-mono shrink-0">
                      {res.room}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-none">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span>{res.date}</span>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span>{res.time}</span>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-1.5 rounded">
                      ที่นั่ง {res.seat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
              <span className="text-2xl select-none">🔍</span>
              <span className="text-xs font-bold text-slate-500">ไม่พบข้อมูลที่นั่ง</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
