'use client';

import { useState, useEffect, useCallback } from 'react';

interface PaginatedResult<T> {
    data?: T[];
    totalCount?: number;
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
    deps: unknown[]
) {
    const [items, setItems]     = useState<T[]>([]);
    const [totalCount, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

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

    useEffect(() => { run(); }, [run]);

    return { items, totalCount, loading, error, refetch: run };
}
