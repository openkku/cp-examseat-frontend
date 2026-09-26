import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-dvh flex flex-col overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 relative transition-colors duration-300">

      {/* Aurora Glow background effects */}
      <div className="absolute top-[-18%] left-[-14%] w-[54%] h-[54%] rounded-full bg-sky-300/14 dark:bg-sky-900/8 blur-[140px] pointer-events-none z-0 transition-colors duration-300"></div>
      <div className="absolute bottom-[-18%] right-[-14%] w-[54%] h-[54%] rounded-full bg-teal-300/14 dark:bg-teal-900/8 blur-[140px] pointer-events-none z-0 transition-colors duration-300"></div>

      {/* Top Navbar */}
      <Navbar />

      {/* Scrollable Main Content Container */}
      <main className="flex-1 relative overflow-hidden flex flex-col z-10 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Tab Navigation */}
      <MobileTabBar />
    </div>
  );
};
