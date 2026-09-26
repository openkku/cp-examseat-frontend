import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApiError, adminFetch } from '@/lib/adminApi';
import { AdminPage } from '@/views/admin/AdminPage';

const status = { rooms: 2, rooms_configured: 3, last_reload: '2026-09-26T12:00:00Z', backups_enabled: false, backups: [], max_upload_mb: 20 };
const rounds = [{ id: 'mid_1_2569', label: 'กลางภาค 1/2569', seats: 10, students: 4, in_schedule_seats: 9, custom_datasets: [{ id: 'LAB', seats: 1 }] }];

function mockBackend(token = 'good') {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const auth = new Headers(init?.headers).get('Authorization');
    if (auth !== `Bearer ${token}`) return new Response('{"error":"Unauthorized"}', { status: 401 });
    if (url.endsWith('/api/admin/status')) return Response.json(status);
    if (url.endsWith('/api/admin/rounds')) return Response.json(rounds);
    return Response.json({ reloaded_at: status.last_reload });
  }));
  return calls;
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('adminFetch', () => {
  it('sends the bearer token and maps errors to readable messages', async () => {
    const calls = mockBackend('good');
    await adminFetch('good', '/status');
    expect(calls[0].url).toBe('/api/admin/status');
    expect(new Headers(calls[0].init?.headers).get('Authorization')).toBe('Bearer good');

    await expect(adminFetch('bad', '/status')).rejects.toMatchObject({ status: 401, message: 'รหัสผู้ดูแลไม่ถูกต้อง' });

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"Import failed: bad sheet"}', { status: 422 })));
    const err = await adminFetch('good', '/import').catch((e) => e);
    expect(err).toBeInstanceOf(AdminApiError);
    expect(err.message).toBe('Import failed: bad sheet');
  });
});

describe('AdminPage', () => {
  it('rejects a wrong token, then signs in and shows rounds and datasets', async () => {
    mockBackend('good');
    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText('Admin token'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
    expect(await screen.findByText('รหัสผู้ดูแลไม่ถูกต้อง')).toBeInTheDocument();
    expect(sessionStorage.getItem('admin_token')).toBeNull();

    fireEvent.change(screen.getByLabelText('Admin token'), { target: { value: 'good' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(await screen.findByText('LAB · 1')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่ได้ตั้งค่าการสำรองอัตโนมัติ/)).toBeInTheDocument();
    expect(sessionStorage.getItem('admin_token')).toBe('good');
  });

  it('signs out when the stored token stops working', async () => {
    sessionStorage.setItem('admin_token', 'stale');
    mockBackend('good');
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByLabelText('Admin token')).toBeInTheDocument());
    expect(sessionStorage.getItem('admin_token')).toBeNull();
  });
});
