/**
 * Search hooks — debounced, cancelable search via React Query.
 *
 * Stale-result prevention (`mobile.md` §8.5): the query is debounced so rapid
 * keystrokes do not fire a request per key. React Query's query-key includes
 * the full query string, so a newer query supersedes an older one; the
 * `select` returns only the latest result. `placeholderData` is undefined
 * (not `keepPreviousData`) so stale results are never rendered over a newer
 * query. The hook returns `isFetching` so the UI can show a loading indicator
 * without flashing stale content.
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { searchKeys } from '@/core/query/query-keys';

import { search } from './api';

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_LENGTH = 2;

/**
 * Debounces a rapidly-changing string value. Returns the debounced value and
 * whether a debounce is pending (raw input has changed but the debounced
 * value has not yet caught up). `pending` is derived, not stored, so it does
 * not trigger cascading renders.
 */
export function useDebouncedQuery(
  rawQuery: string,
  delayMs = SEARCH_DEBOUNCE_MS,
): {
  debounced: string;
  pending: boolean;
} {
  const [debounced, setDebounced] = useState(rawQuery);

  useEffect(() => {
    if (rawQuery === debounced) return;
    const handle = setTimeout(() => {
      setDebounced(rawQuery);
    }, delayMs);
    return () => clearTimeout(handle);
  }, [rawQuery, debounced, delayMs]);

  return { debounced, pending: rawQuery !== debounced };
}

export function useSearch(params: { q: string; itemType?: string; page?: number; limit?: number }) {
  const enabled = params.q.trim().length >= SEARCH_MIN_LENGTH;
  return useQuery({
    queryKey: searchKeys.query(params),
    queryFn: () => search(params),
    select: (data) => data.data,
    enabled,
    staleTime: 60 * 1000,
    // Do not keep previous data — stale results must not render over a newer query.
    placeholderData: undefined,
  });
}
