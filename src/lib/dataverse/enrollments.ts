import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_enrollments';
// Fields: sms_enrollmentid, sms_name, sms_rollnumber, sms_enrollmentdate,
// sms_enrollmentstatus (1=Active, 2=Completed, 3=Dropped)
// Lookups: sms_student→_sms_student_value, sms_class→_sms_class_value,
//          sms_academicyear→_sms_academicyear_value

export interface Enrollment {
    enrollmentid: string;
    name: string;
    rollnumber: string;
    enrollmentdate: string;
    enrollmentstatus: number;
    enrollmentstatusname: string;
    studentid: string;
    studentname: string;
    classid: string;
    classname: string;
    academicyearid: string;
    academicyearname: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateEnrollmentRequest {
    studentid: string;
    classid: string;
    academicyearid: string;
    rollnumber?: string;
    enrollmentdate: string;
    enrollmentstatus?: number;
}

export const ENROLLMENT_STATUS: Record<number, string> = { 1: 'Active', 2: 'Completed', 3: 'Dropped' };

const SELECT = 'sms_enrollmentid,sms_name,sms_rollnumber,sms_enrollmentdate,sms_enrollmentstatus,_sms_student_value,_sms_class_value,_sms_academicyear_value,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEnrollment(item: any): Enrollment {
    return {
        enrollmentid:         item.sms_enrollmentid,
        name:                 item.sms_name ?? '',
        rollnumber:           item.sms_rollnumber ?? '',
        enrollmentdate:       item.sms_enrollmentdate ? item.sms_enrollmentdate.slice(0, 10) : '',
        enrollmentstatus:     item.sms_enrollmentstatus ?? 1,
        enrollmentstatusname: item['sms_enrollmentstatus@OData.Community.Display.V1.FormattedValue'] ?? '',
        studentid:            item._sms_student_value ?? '',
        studentname:          item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        classid:              item._sms_class_value ?? '',
        classname:            item['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        academicyearid:       item._sms_academicyear_value ?? '',
        academicyearname:     item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:            item.createdon ?? '',
        modifiedon:           item.modifiedon ?? '',
    };
}

export const getEnrollments = async (search?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}') or contains(sms_rollnumber,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapEnrollment(item));
};

export const getEnrollmentById = async (id: string): Promise<Enrollment> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapEnrollment(r);
};

export const createEnrollment = async (data: CreateEnrollmentRequest) => {
    const payload: Record<string, unknown> = {
        'sms_student@odata.bind':      `/sms_students(${data.studentid})`,
        'sms_class@odata.bind':        `/sms_classes(${data.classid})`,
        'sms_academicyear@odata.bind': `/sms_academicyears(${data.academicyearid})`,
        sms_enrollmentdate:   data.enrollmentdate,
        sms_enrollmentstatus: data.enrollmentstatus ?? 1,
    };
    if (data.rollnumber) payload.sms_rollnumber = data.rollnumber;
    return dataverseClient.post(TABLE, payload);
};

export const updateEnrollment = async (id: string, data: Partial<CreateEnrollmentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.enrollmentdate   !== undefined) payload.sms_enrollmentdate   = data.enrollmentdate;
    if (data.enrollmentstatus !== undefined) payload.sms_enrollmentstatus = data.enrollmentstatus;
    if (data.rollnumber       !== undefined) payload.sms_rollnumber       = data.rollnumber;
    if (data.studentid        !== undefined) payload['sms_student@odata.bind']      = `/sms_students(${data.studentid})`;
    if (data.classid          !== undefined) payload['sms_class@odata.bind']        = `/sms_classes(${data.classid})`;
    if (data.academicyearid   !== undefined) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getEnrollmentById(id);
};

export const deleteEnrollment = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
