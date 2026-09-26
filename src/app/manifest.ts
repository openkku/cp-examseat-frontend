import type { MetadataRoute } from 'next';

// Lets students install the site to their home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CP Exam Seat — ค้นหาที่นั่งสอบ',
    short_name: 'Exam Seat',
    description: 'ค้นหาที่นั่งสอบ วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fbf8',
    theme_color: '#0047AB',
    lang: 'th',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
