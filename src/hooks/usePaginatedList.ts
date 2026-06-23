'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginatedResult<T> {
    data?: T[];
    totalCount?: number;
}

/** Server-rendered seed for the first page, so the mount fetch can be skipped. */
export interface InitialList<T> {
    items: T[];
    totalCount: number;
}

/**
 * Generic hook for server-paginated lists.
 *
 * Usage:
 *   const { items, totalCount, loading, error, refetch } = usePaginatedList(
 *     () => studentsAPI.getAll({ page, pageSize, search }),
 *     [page, pageSize, search]   // re-fetch when any of these change
 *   );
 *
 * The fetch function is called on mount and whenever a dep changes.
 * It must return (or resolve to) `{ data: T[], totalCount: number }`.
 */
export function usePaginatedList<T>(
    fetchFn: () => Promise<PaginatedResult<T>>,
    deps: unknown[],
    initial?: InitialList<T>
) {
    const [items, setItems]     = useState<T[]>(initial?.items ?? []);
    const [totalCount, setTotal] = useState(initial?.totalCount ?? 0);
    const [loading, setLoading] = useState(!initial);
    const [error, setError]     = useState<string | null>(null);

    // When seeded with server-rendered data, skip the very first (mount) fetch —
    // its deps already match the initial render. Subsequent dep changes refetch.
    const skipNextRun = useRef(!!initial);

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFn();
            setItems(res.data ?? []);
            setTotal(res.totalCount ?? 0);
        } catch (err: unknown) {
            const e = err as { error?: string; message?: string };
            setError(e?.error ?? e?.message ?? 'Failed to fetch');
            setItems([]);
        } finally {
            setLoading(false);
        }
    // fetchFn is intentionally excluded — callers pass deps directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        if (skipNextRun.current) { skipNextRun.current = false; return; }
        run();
    }, [run]);

    return { items, totalCount, loading, error, refetch: run };
}
