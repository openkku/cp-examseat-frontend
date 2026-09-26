'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'web-storage';

type Kind = 'local' | 'session';

function storage(kind: Kind): Storage {
  return kind === 'local' ? localStorage : sessionStorage;
}

function read(kind: Kind, key: string): string | null {
  try {
    return storage(kind).getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function useWebStorage(kind: Kind, key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(kind, key), () => null);

  const setValue = useCallback((next: string | null) => {
    try {
      if (next === null) {
        storage(kind).removeItem(key);
      } else {
        storage(kind).setItem(key, next);
      }
    } catch (e) {
      console.warn(`Could not save "${key}" to ${kind}Storage`, e);
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, [kind, key]);

  return [value, setValue];
}

/**
 * Reads and writes a raw localStorage entry. Renders `null` on the server and
 * during hydration, then the stored value; stays in sync across tabs.
 */
export function useLocalStorage(key: string) {
  return useWebStorage('local', key);
}

/** Like useLocalStorage, but for sessionStorage (cleared when the tab closes). */
export function useSessionStorage(key: string) {
  return useWebStorage('session', key);
}
