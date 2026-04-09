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

export function useStudents(page = 1, pageSize = 10, search?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    pageSize,
    totalCount: 0,
    hasNextPage: false,
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await studentsAPI.getAll({ page, pageSize, search });
      setStudents(response.data ?? []);
      if (response.pagination) setPagination(response.pagination);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.error ?? 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const createStudent = useCallback(async (data: unknown) => {
    const response = await studentsAPI.create(data);
    await fetchStudents();
    return response;
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    await studentsAPI.delete(id);
    await fetchStudents();
  }, [fetchStudents]);

  return { students, loading, error, pagination, refetch: fetchStudents, createStudent, deleteStudent };
}
