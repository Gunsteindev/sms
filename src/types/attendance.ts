import { BaseEntity } from './index';

export interface Attendance extends BaseEntity {
    studentId: string;
    studentName: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
    className: string;
}

export interface AttendanceSummary {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendancePercentage: number;
}