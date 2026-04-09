// src/lib/dataverse/attendance.ts
import { dataverseClient } from "./client";

export interface Attendance {
    attendanceid: string;
    studentid: string;
    studentname?: string;
    date: string;
    status: number;
    checkintime?: string;
    checkouttime?: string;
    remarks?: string;
    classname?: string;
    createdon: string;
}

export interface CreateAttendanceRequest {
    studentid: string;
    date: string;
    status: number;
    checkintime?: string;
    checkouttime?: string;
    remarks?: string;
    classname?: string;
}

export interface AttendanceSummary {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
}

export const getAttendanceByDate = async (date: string, className?: string) => {
    try {
        let filter = `sms_date eq ${date}`;
        if (className) {
            filter += ` and sms_classname eq '${className}'`;
        }
        
        const response = await dataverseClient.getWithFilter<{ value: Attendance[] }>(
            "attendances",
            ["sms_attendanceid", "sms_studentid", "sms_student", "sms_date", "sms_attendancestatus", "sms_checkintime", "sms_remarks"],
            filter,
            "sms_student asc"
        );
        
        console.log(`Attendance for ${date}:`, response.value.length);
        return response.value;
    } catch (error) {
        console.error("Error fetching attendance:", error);
        throw error;
    }
};

export const markAttendance = async (records: CreateAttendanceRequest[]) => {
    try {
        const results = [];
        for (const record of records) {
            const response = await dataverseClient.post<Attendance>("attendances", record);
            results.push(response);
        }
        console.log(`Marked ${records.length} attendance records`);
        return results;
    } catch (error) {
        console.error("Error marking attendance:", error);
        throw error;
    }
};

export const updateAttendance = async (id: string, data: Partial<CreateAttendanceRequest>) => {
    try {
        const response = await dataverseClient.patch<Attendance>(`attendances(${id})`, data);
        return response;
    } catch (error) {
        console.error(`Error updating attendance ${id}:`, error);
        throw error;
    }
};

export const getAttendanceSummary = async (date: string, className?: string): Promise<AttendanceSummary> => {
    try {
        const filter = `sms_date eq ${date}${className ? ` and sms_classname eq '${className}'` : ''}`;
        const response = await dataverseClient.getWithFilter<{ value: Attendance[] }>(
            "attendances",
            ["sms_status"],
            filter
        );
        
        const total = response.value.length;
        const present = response.value.filter(a => a.status === 0).length;
        const absent = response.value.filter(a => a.status === 1).length;
        const late = response.value.filter(a => a.status === 2).length;
        const excused = response.value.filter(a => a.status === 3).length;
        
        return {
            totalStudents: total,
            present,
            absent,
            late,
            excused,
            percentage: total > 0 ? (present / total) * 100 : 0
        };
    } catch (error) {
        console.error("Error fetching attendance summary:", error);
        throw error;
    }
};

export const getStudentAttendanceReport = async (studentId: string, startDate: string, endDate: string) => {
    try {
        const filter = `sms_studentid eq ${studentId} and sms_date ge ${startDate} and sms_date le ${endDate}`;
        const response = await dataverseClient.getWithFilter<{ value: Attendance[] }>(
            "attendances",
            ["sms_attendanceid", "sms_date", "sms_status", "sms_checkintime", "sms_remarks"],
            filter,
            "sms_date asc"
        );
        
        return response.value;
    } catch (error) {
        console.error("Error fetching student attendance report:", error);
        throw error;
    }
};

export const getAttendanceTrends = async (days: number = 30) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const filter = `sms_date ge ${startDateStr} and sms_date le ${endDateStr}`;
        const response = await dataverseClient.getWithFilter<{ value: Attendance[] }>(
            "attendances",
            ["sms_date", "sms_status"],
            filter,
            "sms_date asc"
        );
        
        // Group by date and calculate daily attendance percentage
        const dailyData = new Map();
        response.value.forEach(record => {
            if (!dailyData.has(record.date)) {
                dailyData.set(record.date, { total: 0, present: 0 });
            }
            const day = dailyData.get(record.date);
            day.total++;
            if (record.status === 0) day.present++;
        });
        
        return Array.from(dailyData.entries()).map(([date, data]) => ({
            date,
            percentage: (data.present / data.total) * 100,
            present: data.present,
            total: data.total
        }));
    } catch (error) {
        console.error("Error fetching attendance trends:", error);
        throw error;
    }
};