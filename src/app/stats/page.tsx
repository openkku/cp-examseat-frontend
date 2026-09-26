import type { Metadata } from 'next';
import { StatsPage } from '@/views/Stats';

export const metadata: Metadata = {
  title: 'สถิติ',
};

export default function Page() {
  return <StatsPage />;
}
