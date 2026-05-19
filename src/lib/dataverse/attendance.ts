import { dataverseClient } from "./client";

// Verified Dataverse fields (sms_attendance):
// sms_attendanceid, sms_name, sms_date (DateOnly),
// sms_attendancestatus (1=Present, 2=Absent, 3=Late, 4=Excused),
// sms_checkintime, sms_remarks,
// sms_student  (Lookup → sms_students),  _sms_student_value
// sms_class    (Lookup → sms_classes),   _sms_class_value
// sms_subject  (Lookup → sms_subjects),  _sms_subject_value

const TABLE = 'sms_attendances';

export const ATTENDANCE_STATUS: Record<number, string> = {
    1: 'Present',
    2: 'Absent',
    3: 'Late',
    4: 'Excused',
};

export interface Attendance {
    attendanceid: string;
    studentid: string;
    studentname: string;
    date: string;
    attendancestatus: number;
    checkintime?: string;
    remarks?: string;
    classid?: string;
    classname?: string;
    subjectid?: string;
    subjectname?: string;
    createdon: string;
}

export interface CreateAttendanceRequest {
    studentid: string;
    date: string;
    attendancestatus: number;
    checkintime?: string;
    remarks?: string;
    classid?: string;
    subjectid?: string;
}

export interface AttendanceSummary {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
}

const SELECT = [
    'sms_attendanceid', 'sms_name', 'sms_date', 'sms_attendancestatus',
    'sms_checkintime', 'sms_remarks',
    '_sms_student_value', '_sms_class_value', '_sms_subject_value',
    'createdon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAttendance(item: any): Attendance {
    return {
        attendanceid:     item.sms_attendanceid,
        studentid:        item._sms_student_value ?? '',
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? item.sms_name ?? '',
        date:             item.sms_date ? item.sms_date.slice(0, 10) : '',
        attendancestatus: item.sms_attendancestatus ?? 1,
        checkintime:      item.sms_checkintime ?? undefined,
        remarks:          item.sms_remarks ?? undefined,
        classid:          item._sms_class_value   ?? undefined,
        classname:        item['_sms_class_value@OData.Community.Display.V1.FormattedValue']   ?? undefined,
        subjectid:        item._sms_subject_value ?? undefined,
        subjectname:      item['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? undefined,
        createdon:        item.createdon ?? '',
    };
}

export const getAttendance = async (date?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`, `$top=${top}`];
    if (date) {
        parts.push(`$filter=${encodeURIComponent(`sms_date eq ${date.slice(0, 10)}`)}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapAttendance(item));
};

export const getAttendanceById = async (id: string): Promise<Attendance> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapAttendance(r);
};

export const markAttendance = async (records: CreateAttendanceRequest[]) => {
    const results = [];
    for (const record of records) {
        const payload: Record<string, unknown> = {
            sms_date:             record.date,
            sms_attendancestatus: record.attendancestatus,
        };
        if (record.checkintime) {
            payload.sms_checkintime = record.checkintime.includes('T')
                ? record.checkintime
                : `1970-01-01T${record.checkintime}:00Z`;
        }
        if (record.remarks)   payload.sms_remarks = record.remarks;
        if (record.classid)   payload['sms_class@odata.bind']   = `/sms_classes(${record.classid})`;
        if (record.subjectid) payload['sms_subject@odata.bind'] = `/sms_subjects(${record.subjectid})`;

        // Check for existing record on same student + date to avoid duplicates
        const filter = encodeURIComponent(`_sms_student_value eq ${record.studentid} and sms_date eq ${record.date.slice(0, 10)}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await dataverseClient.get<any>(`${TABLE}?$select=sms_attendanceid&$filter=${filter}&$top=1`);
        const existingId = existing.value?.[0]?.sms_attendanceid;

        if (existingId) {
            await dataverseClient.patch(`${TABLE}(${existingId})`, payload);
            results.push({ sms_attendanceid: existingId, ...payload });
        } else {
            payload['sms_student@odata.bind'] = `/sms_students(${record.studentid})`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            results.push(await dataverseClient.post<any>(TABLE, payload));
        }
    }
    return results;
};

export const updateAttendance = async (id: string, data: Partial<CreateAttendanceRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.attendancestatus !== undefined) payload.sms_attendancestatus = data.attendancestatus;
    if (data.checkintime !== undefined) {
        payload.sms_checkintime = data.checkintime
            ? (data.checkintime.includes('T') ? data.checkintime : `1970-01-01T${data.checkintime}:00Z`)
            : null;
    }
    if (data.remarks  !== undefined) payload.sms_remarks = data.remarks || null;
    if (data.classid  !== undefined) payload['sms_class@odata.bind']   = data.classid   ? `/sms_classes(${data.classid})`   : null;
    if (data.subjectid !== undefined) payload['sms_subject@odata.bind'] = data.subjectid ? `/sms_subjects(${data.subjectid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
};

export const deleteAttendance = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getAttendanceSummary = async (date: string): Promise<AttendanceSummary> => {
    const filter = encodeURIComponent(`sms_date eq ${date.slice(0, 10)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_attendancestatus&$filter=${filter}`);
    const records = r.value ?? [];
    const total   = records.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const present = records.filter((a: any) => a.sms_attendancestatus === 1).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const absent  = records.filter((a: any) => a.sms_attendancestatus === 2).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const late    = records.filter((a: any) => a.sms_attendancestatus === 3).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const excused = records.filter((a: any) => a.sms_attendancestatus === 4).length;
    return { totalStudents: total, present, absent, late, excused, percentage: total > 0 ? (present / total) * 100 : 0 };
};

export const getStudentAttendanceReport = async (studentId: string, startDate: string, endDate: string) => {
    const start = startDate.slice(0, 10);
    const end   = endDate.slice(0, 10);
    const filter = encodeURIComponent(
        `sms_student/sms_studentid eq ${studentId} and sms_date ge ${start} and sms_date le ${end}`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=sms_date asc`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapAttendance(item));
};

export const getStudentAttendance = async (studentId: string, top = 100): Promise<Attendance[]> => {
    const filter = encodeURIComponent(`_sms_student_value eq ${studentId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=sms_date desc&$top=${top}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapAttendance(item));
};

export const getAttendanceTrends = async (days = 30) => {
    const endDate   = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr   = endDate.toISOString().split('T')[0];
    const filter   = encodeURIComponent(`sms_date ge ${startStr} and sms_date le ${endStr}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_date,sms_attendancestatus&$filter=${filter}&$orderby=sms_date asc`);
    const records = r.value ?? [];

    const dailyMap = new Map<string, { total: number; present: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    records.forEach((rec: any) => {
        const d = (rec.sms_date as string).slice(0, 10);
        if (!dailyMap.has(d)) dailyMap.set(d, { total: 0, present: 0 });
        const day = dailyMap.get(d)!;
        day.total++;
        if (rec.sms_attendancestatus === 1) day.present++;
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        percentage: (data.present / data.total) * 100,
        present:    data.present,
        total:      data.total,
    }));
};
