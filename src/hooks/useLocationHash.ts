'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The current URL fragment (e.g. "#room-cp.9127"), or "" on the server. */
export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => '');
}
