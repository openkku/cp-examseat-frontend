import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/layout/PageLoading';
import { RoomExplorer } from '@/views/RoomExplorer';

export const metadata: Metadata = {
  title: 'สำรวจห้องสอบ',
};

// RoomExplorer reads ?round=&date=&time=&room=&seat= via useSearchParams, so it renders on the client.
export default function ExplorerPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RoomExplorer />
    </Suspense>
  );
}
