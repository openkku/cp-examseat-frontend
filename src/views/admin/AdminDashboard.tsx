'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Database, Download, LogOut, RefreshCw } from '@/components/icons';
import { AdminApiError, adminApi, type AdminStatus, type RoundSummary } from '@/lib/adminApi';
import { ImportForm } from '@/views/admin/ImportForm';
import { RoundsTable } from '@/views/admin/RoundsTable';

export interface Notice {
  kind: 'success' | 'error';
  text: string;
}

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) || d.getFullYear() < 2000 ? '-' : d.toLocaleString('th-TH');
};

const formatSize = (bytes: number) =>
  bytes >= 1 << 20 ? `${(bytes / (1 << 20)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [rounds, setRounds] = useState<RoundSummary[] | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = useCallback((err: unknown) => {
    if (err instanceof AdminApiError && err.status === 401) {
      onLogout();
      return;
    }
    setNotice({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
  }, [onLogout]);

  const refresh = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([adminApi.status(token), adminApi.rounds(token)]);
      setStatus(s);
      setRounds(r);
    } catch (err) {
      fail(err);
    }
  }, [token, fail]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.status(token), adminApi.rounds(token)])
      .then(([s, r]) => {
        if (cancelled) return;
        setStatus(s);
        setRounds(r);
      })
      .catch((err) => { if (!cancelled) fail(err); });
    return () => { cancelled = true; };
  }, [token, fail]);

  /** Runs an admin action, reporting its outcome and refreshing the data. */
  const run = useCallback(async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ kind: 'success', text: success });
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }, [refresh, fail]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">ผู้ดูแลระบบ</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              นำเข้าและจัดการข้อมูลห้องสอบ การเปลี่ยนแปลงมีผลทันทีโดยไม่ต้องรีสตาร์ต
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={onLogout}>
            ออกจากระบบ
          </Button>
        </div>

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${notice.kind === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'}`}
          >
            {notice.text}
          </div>
        )}

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-xs">
              <Stat label="รอบสอบ" value={rounds ? String(rounds.length) : '…'} />
              <Stat label="ห้องที่มีผัง" value={status ? `${status.rooms} / ${status.rooms_configured}` : '…'} />
              <Stat label="โหลดข้อมูลล่าสุด" value={status ? formatTime(status.last_reload) : '…'} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => run(() => adminApi.reload(token), 'โหลดข้อมูลและไฟล์ห้องใหม่แล้ว')}
              >
                โหลดข้อมูลใหม่
              </Button>
              {status?.backups_enabled && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  icon={<Database className="w-4 h-4" />}
                  onClick={() => run(() => adminApi.createBackup(token), 'สำรองฐานข้อมูลแล้ว')}
                >
                  สำรองข้อมูลตอนนี้
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                icon={<Download className="w-4 h-4" />}
                onClick={() => run(() => adminApi.downloadBackup(token), 'ดาวน์โหลดไฟล์สำรองแล้ว')}
              >
                ดาวน์โหลดฐานข้อมูล
              </Button>
            </div>
          </div>

          {status && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              {status.backups_enabled ? (
                status.backups.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-bold text-slate-500 dark:text-slate-400">ไฟล์สำรองล่าสุด:</span>
                    {status.backups.slice(0, 5).map((b) => (
                      <Badge key={b.name} variant="slate" size="sm" className="font-mono">
                        {formatTime(b.created_at)} · {formatSize(b.size)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">ยังไม่มีไฟล์สำรอง</span>
                )
              ) : (
                <span className="text-amber-700 dark:text-amber-300 font-semibold">
                  ยังไม่ได้ตั้งค่าการสำรองอัตโนมัติ (ตั้ง BACKUP_DIR ที่ backend)
                </span>
              )}
            </div>
          )}
        </Card>

        <ImportForm
          token={token}
          busy={busy}
          rounds={rounds ?? []}
          maxUploadMB={status?.max_upload_mb}
          run={run}
        />

        <RoundsTable token={token} busy={busy} rounds={rounds} run={run} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xxs">{label}</div>
      <div className="mt-1 font-black text-slate-800 dark:text-slate-100 text-sm">{value}</div>
    </div>
  );
}
