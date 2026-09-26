'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyRound } from '@/components/icons';
import { useSessionStorage } from '@/hooks/useLocalStorage';
import { AdminApiError, adminApi } from '@/lib/adminApi';
import { AdminDashboard } from '@/views/admin/AdminDashboard';

const TOKEN_KEY = 'admin_token';

/** Admin area: data import and management through the backend admin API. */
export function AdminPage() {
  const [token, setToken] = useSessionStorage(TOKEN_KEY);

  if (!token) return <AdminLogin onLogin={setToken} />;
  return <AdminDashboard token={token} onLogout={() => setToken(null)} />;
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = value.trim();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await adminApi.status(token);
      onLogin(token);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'ติดต่อ backend ไม่ได้');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto flex items-start justify-center p-4 pt-16">
      <Card className="w-full max-w-sm p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <KeyRound className="w-5 h-5 text-faculty dark:text-blue-300" />
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">ผู้ดูแลระบบ</h1>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">
          ใส่ ADMIN_TOKEN ของ backend รหัสจะถูกเก็บไว้เฉพาะแท็บนี้จนกว่าจะปิด
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="password"
            label="Admin token"
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={error || undefined}
          />
          <Button type="submit" fullWidth disabled={busy || !value.trim()}>
            {busy ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
