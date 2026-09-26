import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <EmptyState
        title="ไม่พบหน้าที่ต้องการ"
        description="ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว"
        icon="🧭"
        action={
          <Link href="/" className="text-faculty dark:text-blue-300 font-bold hover:underline text-xs uppercase tracking-wider">
            กลับหน้าหลัก
          </Link>
        }
      />
    </div>
  );
}
