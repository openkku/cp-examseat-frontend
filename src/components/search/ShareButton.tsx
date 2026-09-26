'use client';

import { useState } from 'react';
import { Check, Share2 } from '@/components/icons';

/** Shares (mobile) or copies (desktop) the current page URL. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard unavailable: nothing to do.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-faculty dark:hover:text-blue-300 transition-colors cursor-pointer min-h-8"
      aria-live="polite"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์ลิงก์ตารางสอบ'}
    </button>
  );
}
