'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Trash2 } from '@/components/icons';
import { adminApi, type RoundSummary } from '@/lib/adminApi';

interface RoundsTableProps {
  token: string;
  busy: boolean;
  rounds: RoundSummary[] | null;
  run: (action: () => Promise<unknown>, success: string) => Promise<void>;
}

/** Lists rounds with seat counts; rename, delete rounds or single custom datasets. */
export function RoundsTable({ token, busy, rounds, run }: RoundsTableProps) {
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);

  const saveLabel = () => {
    if (!editing || !editing.label.trim()) return;
    const { id, label } = editing;
    run(() => adminApi.rename(token, id, label.trim()), `เปลี่ยนชื่อรอบ ${id} แล้ว`).then(() => setEditing(null));
  };

  const deleteRound = (round: RoundSummary) => {
    if (!window.confirm(`ลบรอบ "${round.label}" (${round.id}) และที่นั่งทั้งหมด ${round.seats.toLocaleString()} รายการ? การลบย้อนกลับไม่ได้ (นอกจากกู้จากไฟล์สำรอง)`)) return;
    run(() => adminApi.deleteRound(token, round.id), `ลบรอบ ${round.id} แล้ว`);
  };

  const deleteDataset = (round: RoundSummary, datasetId: string) => {
    if (!window.confirm(`ลบชุดข้อมูล ${datasetId} ออกจากรอบ ${round.id}?`)) return;
    run(() => adminApi.deleteRound(token, round.id, datasetId), `ลบชุดข้อมูล ${datasetId} แล้ว`);
  };

  return (
    <Card className="p-5">
      <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4">รอบสอบ</h2>
      {rounds === null ? (
        <div className="h-24 rounded-xl shimmer" />
      ) : rounds.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูล นำเข้าไฟล์ด้านบนเพื่อเริ่มต้น</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rounds.map((round) => (
            <li key={round.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {editing?.id === round.id ? (
                    <form
                      className="flex gap-2 items-center"
                      onSubmit={(e) => { e.preventDefault(); saveLabel(); }}
                    >
                      <input
                        autoFocus
                        aria-label={`ชื่อรอบ ${round.id}`}
                        value={editing.label}
                        maxLength={200}
                        onChange={(e) => setEditing({ id: round.id, label: e.target.value })}
                        className="min-h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-bold"
                      />
                      <Button type="submit" size="sm" disabled={busy}>บันทึก</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
                    </form>
                  ) : (
                    <div className="font-extrabold text-slate-800 dark:text-slate-100">{round.label}</div>
                  )}
                  <div className="font-mono text-xs text-slate-400 mt-0.5">{round.id}</div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    {round.seats.toLocaleString()} ที่นั่ง · {round.students.toLocaleString()} คน · ในตาราง {round.in_schedule_seats.toLocaleString()}
                  </div>
                  {round.custom_datasets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {round.custom_datasets.map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1">
                          <Badge variant="navy" size="sm" className="font-mono">{d.id} · {d.seats}</Badge>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => deleteDataset(round, d.id)}
                            title={`ลบชุดข้อมูล ${d.id}`}
                            aria-label={`ลบชุดข้อมูล ${d.id}`}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => setEditing({ id: round.id, label: round.label })}
                  >
                    แก้ชื่อ
                  </Button>
                  <Button variant="danger" size="sm" disabled={busy} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => deleteRound(round)}>
                    ลบรอบ
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
