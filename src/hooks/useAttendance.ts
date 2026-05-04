'use client';

import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '@/lib/api-client';
import type { Attendance, AttendanceSummary, CreateAttendanceRequest } from '@/lib/dataverse/attendance';

export function useAttendance(date?: string, className?: string) {
    const [records, setRecords] = useState<Attendance[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendance = useCallback(async () => {
        if (!date) return;
        setLoading(true);
        setError(null);
        try {
            const [recordsRes, summaryRes] = await Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                attendanceAPI.getByDate(date, className) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                attendanceAPI.getSummary(date, className) as any,
            ]);
            setRecords(recordsRes.data ?? []);
            setSummary(summaryRes.data ?? null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.error ?? 'Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    }, [date, className]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const markAttendance = useCallback(async (attendanceRecords: CreateAttendanceRequest[]) => {
        const response = await attendanceAPI.markBulk(attendanceRecords);
        await fetchAttendance();
        return response;
    }, [fetchAttendance]);

    return { records, summary, loading, error, markAttendance, refetch: fetchAttendance };
}
