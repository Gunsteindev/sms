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

export function useStudents(page = 1, pageSize = 15, search?: string, status?: number) {
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page, pageSize, totalCount: 0, hasNextPage: false });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await studentsAPI.getAll({ page, pageSize, search: search || undefined, status });
      const items: Student[] = response.data ?? [];
      setStudents(items);
      setPagination(
        response.pagination ?? { page, pageSize, totalCount: items.length, hasNextPage: false }
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.error ?? err.message ?? 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return { students, loading, error, pagination, refetch: fetchStudents };
}
