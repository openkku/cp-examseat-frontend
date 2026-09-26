import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const title = 'College of Computing KKU Exam Seat Lookup';
const description = 'ค้นหาห้องสอบวิทยาลัยคอมจะไม่ลําบากอีกต่อไป';

export const metadata: Metadata = {
  title: { default: title, template: '%s | CP Exam Seat' },
  description,
  openGraph: {
    title,
    description,
    url: 'https://cp.0y.lv',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fbf8' },
    { media: '(prefers-color-scheme: dark)', color: '#09150f' },
  ],
};

// Applies the saved (or system) color scheme before first paint to avoid a flash.
const themeScript = `
try {
  if (localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=prompt:500|sarabun:700i" rel="stylesheet" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
