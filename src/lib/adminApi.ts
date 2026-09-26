import { apiUrl } from '@/lib/api';

export interface CustomDataset {
  id: string;
  seats: number;
}

export interface RoundSummary {
  id: string;
  label: string;
  seats: number;
  students: number;
  in_schedule_seats: number;
  custom_datasets: CustomDataset[];
}

export interface BackupInfo {
  name: string;
  size: number;
  created_at: string;
}

export interface AdminStatus {
  rooms: number;
  rooms_configured: number;
  last_reload: string;
  backups_enabled: boolean;
  backups: BackupInfo[];
  max_upload_mb: number;
}

export interface ImportResult {
  round: string;
  seats: number;
  reloaded_at: string;
}

/** An error response from the admin API, with a message fit for display. */
export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function messageOf(res: Response): Promise<string> {
  if (res.status === 401) return 'รหัสผู้ดูแลไม่ถูกต้อง';
  if (res.status === 404) return 'ไม่พบข้อมูล หรือยังไม่ได้เปิดใช้ Admin API (ตั้ง ADMIN_TOKEN ที่ backend)';
  if (res.status === 429) return 'ส่งคำขอถี่เกินไป กรุณารอสักครู่';
  try {
    const body = await res.json();
    if (body?.error) return String(body.error);
  } catch {
    // Not JSON.
  }
  return `เกิดข้อผิดพลาด (${res.status})`;
}

/** Calls an /api/admin endpoint with the bearer token, throwing AdminApiError on failure. */
export async function adminFetch(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(apiUrl(`/api/admin${path}`), { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new AdminApiError(res.status, await messageOf(res));
  return res;
}

export async function adminJSON<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return (await adminFetch(token, path, init)).json();
}

export const adminApi = {
  status: (token: string) => adminJSON<AdminStatus>(token, '/status'),
  rounds: (token: string) => adminJSON<RoundSummary[]>(token, '/rounds'),
  rename: (token: string, round: string, label: string) =>
    adminJSON(token, `/rounds/${encodeURIComponent(round)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    }),
  deleteRound: (token: string, round: string, customId?: string) =>
    adminJSON(token, `/rounds/${encodeURIComponent(round)}${customId ? `?custom_id=${encodeURIComponent(customId)}` : ''}`, { method: 'DELETE' }),
  importFile: (token: string, form: FormData) => adminJSON<ImportResult>(token, '/import', { method: 'POST', body: form }),
  reload: (token: string) => adminJSON(token, '/reload', { method: 'POST' }),
  createBackup: (token: string) => adminJSON<BackupInfo>(token, '/backups', { method: 'POST' }),
  /** Downloads a fresh database snapshot through the browser. */
  downloadBackup: async (token: string) => {
    const res = await adminFetch(token, '/backup');
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'exams-backup.db';
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  },
};
