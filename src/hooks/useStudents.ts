'use client';

import { usePaginatedList, type InitialList } from './usePaginatedList';
import { studentsAPI } from '@/lib/api/people';
import type { Student } from '@/lib/dataverse/students';

export function useStudents(page = 1, pageSize = 20, search?: string, status?: number, initial?: InitialList<Student>) {
    const { items, totalCount, loading, error, refetch } = usePaginatedList<Student>(
        () => studentsAPI.getAll({ search, status, page, pageSize }) as unknown as Promise<{ data: Student[]; totalCount: number }>,
        [search, status, page, pageSize],
        initial
    );

    return {
        students: items,
        loading,
        error,
        refetch,
        pagination: {
            page,
            pageSize,
            totalCount,
            hasNextPage: page * pageSize < totalCount,
        },
    };
}
