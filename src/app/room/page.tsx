import type { Metadata } from 'next';
import { RoomInfo } from '@/views/RoomInfo';

export const metadata: Metadata = {
  title: 'ห้องสอบ',
};

export default function RoomPage() {
  return <RoomInfo />;
}
