import { dataverseClient } from "./client";

const TABLE = 'sms_classes';

// Verified Dataverse fields (sms_classes) — discovered 2026-04-21:
// sms_classid, sms_name, sms_classnumber, sms_section, sms_capacity,
// sms_roomnumber, sms_enrolledcount (rollup),
// _sms_academicyear_value (Lookup → sms_academicyears),
// _sms_gradelevel_value   (Lookup → sms_gradelevels),
// _sms_teacher_value      (Lookup → sms_teachers),   ← NOT _sms_classteacher_value
// createdon, modifiedon
// NOTE: sms_gradelevel (integer) does NOT exist — grade is a lookup.

export interface Class {
    classid:          string;
    classname:        string;
    classnumber:      string;
    section:          string;
    capacity:         number;
    enrolledcount:    number;
    roomnumber:       string;
    academicyearid:   string;
    academicyearname: string;
    gradelevelid:     string;
    gradelevelname:   string;
    teacherid:        string;
    teachername:      string;
    createdon:        string;
    modifiedon:       string;
}

export interface CreateClassRequest {
    classname:       string;
    classnumber?:    string;
    section?:        string;
    capacity:        number;
    roomnumber:      string;
    /** GUID of the academic year record */
    academicyearid?: string;
    /** GUID of the grade level record */
    gradelevelid?:   string;
    /** GUID of the teacher record */
    teacherid?:      string;
}

const SELECT = [
    'sms_classid', 'sms_name', 'sms_classnumber', 'sms_section',
    'sms_capacity', 'sms_roomnumber', 'sms_enrolledcount',
    '_sms_academicyear_value',
    '_sms_gradelevel_value',
    '_sms_teacher_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClass(item: any): Class {
    return {
        classid:          item.sms_classid                    ?? '',
        classname:        item.sms_name                       ?? '',
        classnumber:      item.sms_classnumber                ?? '',
        section:          item.sms_section                    ?? '',
        capacity:         item.sms_capacity                   ?? 0,
        enrolledcount:    item.sms_enrolledcount              ?? 0,
        roomnumber:       item.sms_roomnumber                 ?? '',
        academicyearid:   item._sms_academicyear_value        ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        gradelevelid:     item._sms_gradelevel_value          ?? '',
        gradelevelname:   item['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue']   ?? '',
        teacherid:        item._sms_teacher_value             ?? '',
        teachername:      item['_sms_teacher_value@OData.Community.Display.V1.FormattedValue']      ?? '',
        createdon:        item.createdon                      ?? '',
        modifiedon:       item.modifiedon                     ?? '',
    };
}

export const getClasses = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.get<any>(
        `${TABLE}?$select=${SELECT}&$orderby=sms_name asc`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.value ?? []).map((item: any) => mapClass(item));
};

export const getClassById = async (id: string): Promise<Class> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapClass(r);
};

export const createClass = async (data: CreateClassRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:     data.classname,
        sms_capacity: data.capacity,
        sms_roomnumber: data.roomnumber,
    };
    if (data.classnumber)    payload.sms_classnumber = data.classnumber;
    if (data.section)        payload.sms_section     = data.section;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    if (data.gradelevelid)   payload['sms_gradelevel@odata.bind']   = `/sms_gradelevels(${data.gradelevelid})`;
    if (data.teacherid)      payload['sms_teacher@odata.bind']      = `/sms_teachers(${data.teacherid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateClass = async (id: string, data: Partial<CreateClassRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.classname     !== undefined) payload.sms_name       = data.classname;
    if (data.classnumber   !== undefined) payload.sms_classnumber = data.classnumber;
    if (data.section       !== undefined) payload.sms_section    = data.section;
    if (data.capacity      !== undefined) payload.sms_capacity   = data.capacity;
    if (data.roomnumber    !== undefined) payload.sms_roomnumber = data.roomnumber;
    if (data.academicyearid !== undefined)
        payload['sms_academicyear@odata.bind'] = data.academicyearid ? `/sms_academicyears(${data.academicyearid})` : null;
    if (data.gradelevelid !== undefined)
        payload['sms_gradelevel@odata.bind']   = data.gradelevelid   ? `/sms_gradelevels(${data.gradelevelid})`   : null;
    if (data.teacherid !== undefined)
        payload['sms_teacher@odata.bind']      = data.teacherid      ? `/sms_teachers(${data.teacherid})`         : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getClassById(id);
};

export const deleteClass = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getClassesCount = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(
        `${TABLE}?$select=sms_classid,sms_capacity,_sms_gradelevel_value&$count=true`
    );
    const classes = r.value ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalCapacity = classes.reduce((sum: number, c: any) => sum + (c.sms_capacity || 0), 0);

    const byGrade: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classes.forEach((c: any) => {
        const name = c['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown';
        byGrade[name] = (byGrade[name] || 0) + 1;
    });

    return {
        total: r['@odata.count'] ?? classes.length,
        byGrade,
        totalCapacity,
    };
};

export const getClassesByGradeLevel = async (gradelevelid: string) => {
    const filter = encodeURIComponent(`_sms_gradelevel_value eq ${gradelevelid}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(
        `${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=sms_name asc`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapClass(item));
};
