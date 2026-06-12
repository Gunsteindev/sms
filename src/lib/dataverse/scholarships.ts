import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_scholarships';
// Actual Dataverse fields (verified via EntityDefinitions metadata):
//   sms_scholarshipid, sms_name, sms_condition (memo),
//   sms_type (922330000=Full, 922330001=Partial, 922330002=Bursary),
//   sms_amount, sms_percentage, sms_startdate, sms_enddate,
//   sms_sponsoredby,
//   sms_student (lookup → _sms_student_value),
//   sms_academicyear (lookup → _sms_academicyear_value)

export interface Scholarship {
    scholarshipid:   string;
    name:            string;
    condition:       string;   // terms / notes about the scholarship
    sponsoredby:     string;
    scholarshiptype: number;   // maps to sms_type option set
    amount:          number;
    percentage:      number;
    startdate:       string;
    enddate:         string;
    studentid:       string;
    studentname:     string;
    academicyearid:  string;
    academicyearname: string;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateScholarshipRequest {
    name:            string;
    condition?:      string;
    sponsoredby?:    string;
    scholarshiptype: number;
    amount?:         number;
    percentage?:     number;
    startdate:       string;
    enddate?:        string;
    studentid?:      string;
    academicyearid?: string;
}

export const SCHOLARSHIP_TYPES: Record<number, string> = {
    922330000: 'Full',
    922330001: 'Partial',
    922330002: 'Bursary',
};

const SELECT = 'sms_scholarshipid,sms_name,sms_condition,sms_type,sms_amount,sms_percentage,sms_startdate,sms_enddate,sms_sponsoredby,_sms_student_value,_sms_academicyear_value,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScholarship(item: any): Scholarship {
    return {
        scholarshipid:    item.sms_scholarshipid,
        name:             item.sms_name             ?? '',
        condition:        item.sms_condition         ?? '',
        sponsoredby:      item.sms_sponsoredby       ?? '',
        scholarshiptype:  item.sms_type              ?? 922330000,
        amount:           item.sms_amount            ?? 0,
        percentage:       item.sms_percentage        ?? 0,
        startdate:        item.sms_startdate         ?? '',
        enddate:          item.sms_enddate           ?? '',
        studentid:        item._sms_student_value    ?? '',
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon  ?? '',
        modifiedon:       item.modifiedon ?? '',
    };
}

export const getScholarships = async (search?: string): Promise<Scholarship[]> => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapScholarship(item));
};

export const getScholarshipById = async (id: string): Promise<Scholarship> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapScholarship(r);
};

export const createScholarship = async (data: CreateScholarshipRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:  data.name,
        sms_type:  data.scholarshiptype,
        sms_startdate: data.startdate,
    };
    if (data.condition)     payload.sms_condition   = data.condition;
    if (data.sponsoredby)   payload.sms_sponsoredby = data.sponsoredby;
    if (data.amount)        payload.sms_amount      = data.amount;
    if (data.percentage)    payload.sms_percentage  = data.percentage;
    if (data.enddate)       payload.sms_enddate     = data.enddate;
    if (data.studentid)     payload['sms_student@odata.bind']      = `/sms_students(${data.studentid})`;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateScholarship = async (id: string, data: Partial<CreateScholarshipRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name            !== undefined) payload.sms_name        = data.name;
    if (data.condition       !== undefined) payload.sms_condition   = data.condition;
    if (data.sponsoredby     !== undefined) payload.sms_sponsoredby = data.sponsoredby;
    if (data.scholarshiptype !== undefined) payload.sms_type        = data.scholarshiptype;
    if (data.amount          !== undefined) payload.sms_amount      = data.amount;
    if (data.percentage      !== undefined) payload.sms_percentage  = data.percentage;
    if (data.startdate       !== undefined) payload.sms_startdate   = data.startdate;
    if (data.enddate         !== undefined) payload.sms_enddate     = data.enddate;
    if (data.studentid       !== undefined) payload['sms_student@odata.bind']      = `/sms_students(${data.studentid})`;
    if (data.academicyearid  !== undefined) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getScholarshipById(id);
};

export const deleteScholarship = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
