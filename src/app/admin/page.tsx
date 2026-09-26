import type { Metadata } from 'next';
import { AdminPage } from '@/views/admin/AdminPage';

export const metadata: Metadata = {
  title: 'ผู้ดูแลระบบ',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPage />;
}
