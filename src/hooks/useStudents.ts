'use client';

import { usePaginatedList } from './usePaginatedList';
import { studentsAPI } from '@/lib/api/people';
import type { Student } from '@/lib/dataverse/students';

export function useStudents(page = 1, pageSize = 20, search?: string, status?: number) {
    const { items, totalCount, loading, error, refetch } = usePaginatedList<Student>(
        () => studentsAPI.getAll({ search, status, page, pageSize }) as unknown as Promise<{ data: Student[]; totalCount: number }>,
        [search, status, page, pageSize]
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
