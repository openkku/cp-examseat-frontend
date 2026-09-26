'use client';

import { useCallback } from 'react';

type ParamsInit = URLSearchParams | Record<string, string>;
type NextParams = ParamsInit | ((prev: URLSearchParams) => ParamsInit);

/**
 * Updates the query string without a navigation, like React Router's
 * `setSearchParams`. Next.js syncs native history updates into
 * `useSearchParams`. The returned function is stable.
 */
export function useSetSearchParams() {
  return useCallback((next: NextParams, options?: { replace?: boolean }) => {
    const current = new URLSearchParams(window.location.search);
    const value = typeof next === 'function' ? next(current) : next;
    const params = new URLSearchParams(value);
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

    if (options?.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  }, []);
}
