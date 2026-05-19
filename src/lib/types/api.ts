// Shared API response shapes used by both route handlers (server) and hooks (client).

/** A paginated list response from any collection endpoint. */
export interface PagedResponse<T> {
    success: boolean;
    data: T[];
    totalCount: number;
    page?: number;
    pageSize?: number;
}

/** A single-record response from any resource endpoint. */
export interface SingleResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/** Error response shape returned by the API on failure. */
export interface ApiError {
    success: false;
    error: string;
    dvMessage?: string;
    detail?: unknown;
}
