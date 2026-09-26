'use client';

import { useCallback, useSyncExternalStore } from 'react';

const LOCAL_STORAGE_EVENT = 'local-storage';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(LOCAL_STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LOCAL_STORAGE_EVENT, onChange);
  };
}

/**
 * Reads and writes a raw localStorage entry. Renders `null` on the server and
 * during hydration, then the stored value; stays in sync across tabs.
 */
export function useLocalStorage(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);

  const setValue = useCallback((next: string | null) => {
    try {
      if (next === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, next);
      }
    } catch (e) {
      console.warn(`Could not save "${key}" to localStorage`, e);
    }
    window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
  }, [key]);

  return [value, setValue];
}
