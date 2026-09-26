import { Suspense } from 'react';
import { PageLoading } from '@/components/layout/PageLoading';
import { StudentSearch } from '@/views/StudentSearch';

// StudentSearch reads ?id=&round= via useSearchParams, so it renders on the client.
export default function StudentSearchPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <StudentSearch />
    </Suspense>
  );
}
