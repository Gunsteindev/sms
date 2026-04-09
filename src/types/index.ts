export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
}

export type UserRole = 'admin' | 'teacher' | 'staff' | 'parent' | 'student';