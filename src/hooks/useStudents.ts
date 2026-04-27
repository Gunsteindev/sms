'use client';

import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '@/lib/api-client';
import type { Student } from '@/lib/dataverse/students';

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

// Fetches all students matching the current filters once, then paginates client-side.
// Page navigation is instant — only filter/search changes trigger a new Dataverse call.
export function useStudents(page = 1, pageSize = 20, search?: string, status?: number) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await studentsAPI.getAll({ search: search || undefined, status });
      setAllStudents(response.data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.error ?? err.message ?? 'Failed to fetch students');
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]); // page/pageSize intentionally excluded — handled client-side

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const start      = (page - 1) * pageSize;
  const students   = allStudents.slice(start, start + pageSize);
  const totalCount = allStudents.length;

  const pagination: Pagination = {
    page,
    pageSize,
    totalCount,
    hasNextPage: start + pageSize < totalCount,
  };

  return { students, loading, error, pagination, refetch: fetchStudents };
}
