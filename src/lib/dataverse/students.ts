import { dataverseClient } from "./client";

const TABLE = 'sms_students';

// Actual Dataverse fields (verified from schema):
// sms_studentid, sms_name, sms_firstname, sms_lastname, sms_dateofbirth,
// sms_gender, sms_email, sms_phone, sms_address, sms_enrollmentdate,
// sms_studentnumber, sms_studentstatus, sms_guardianname, sms_guardianphone,
// sms_guardianemail, _sms_class_value, _sms_gradelevel_value, _sms_parent_value

export interface Student {
    studentid: string;
    firstname: string;
    lastname: string;
    fullname: string;
    dateofbirth: string;
    gender: number;
    email: string;
    phone: string;
    address: string;
    enrollmentdate: string;
    studentstatus: number;
    enrollmentstatus: number;
    specialneeds: boolean;
    guardianname: string;
    guardianphone: string;
    guardianemail: string;
    rollnumber: string;
    classname: string;
    classid: string;
    gradelevelid: string;
    parentid: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateStudentRequest {
    firstname: string;
    lastname: string;
    dateofbirth: string;
    gender: number;
    email?: string;
    phone?: string;
    address?: string;
    enrollmentdate: string;
    rollnumber?: string;
    classid?: string;
    gradelevelid?: string;
}

export interface StudentFilters {
    search?: string;
    status?: number;
    page?: number;
    pageSize?: number;
}

const SELECT = [
    'sms_studentid', 'sms_name', 'sms_firstname', 'sms_lastname',
    'sms_dateofbirth', 'sms_gender', 'sms_email', 'sms_phone', 'sms_address',
    'sms_enrollmentdate', 'sms_studentstatus', 'sms_enrollmentstatus',
    'sms_specialneeds', 'sms_studentnumber',
    'sms_guardianname', 'sms_guardianphone', 'sms_guardianemail',
    '_sms_class_value', '_sms_gradelevel_value', '_sms_parent_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudent(item: any): Student {
    return {
        studentid:    item.sms_studentid,
        firstname:    item.sms_firstname ?? '',
        lastname:     item.sms_lastname  ?? '',
        fullname:     item.sms_name      ?? `${item.sms_firstname ?? ''} ${item.sms_lastname ?? ''}`.trim(),
        dateofbirth:  item.sms_dateofbirth   ?? '',
        gender:       item.sms_gender        ?? 1,
        email:        item.sms_email         ?? '',
        phone:        item.sms_phone         ?? '',
        address:      item.sms_address       ?? '',
        enrollmentdate:  item.sms_enrollmentdate   ?? '',
        studentstatus:   item.sms_studentstatus   ?? 1,
        enrollmentstatus: item.sms_enrollmentstatus ?? 0,
        specialneeds:    item.sms_specialneeds     ?? false,
        guardianname:    item.sms_guardianname     ?? '',
        guardianphone:  item.sms_guardianphone  ?? '',
        guardianemail:  item.sms_guardianemail  ?? '',
        rollnumber:   item.sms_studentnumber ?? '',
        classname:    item['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        classid:      item._sms_class_value      ?? '',
        gradelevelid: item._sms_gradelevel_value ?? '',
        parentid:     item._sms_parent_value     ?? '',
        createdon:    item.createdon  ?? '',
        modifiedon:   item.modifiedon ?? '',
    };
}

export const getStudents = async (filters?: StudentFilters) => {
    const pageSize = filters?.pageSize ?? 15;
    const parts: string[] = [
        `$select=${SELECT}`,
        `$orderby=sms_firstname asc`,
        `$top=${pageSize}`,
        `$count=true`,
    ];

    const conditions: string[] = [];
    if (filters?.search) {
        const q = filters.search.replace(/'/g, "''");
        conditions.push(`(contains(sms_firstname,'${q}') or contains(sms_lastname,'${q}') or contains(sms_studentnumber,'${q}'))`);
    }
    if (filters?.status) conditions.push(`sms_studentstatus eq ${filters.status}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (response.value ?? []).map((r: any) => mapStudent(r));
    return {
        items,
        totalCount: response['@odata.count'] ?? items.length,
        page:       filters?.page ?? 1,
        pageSize,
        hasNextPage: !!response['@odata.nextLink'],
        nextLink:    response['@odata.nextLink'] ?? null,
    };
};

export const getStudentById = async (id: string): Promise<Student> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapStudent(r);
};

export const createStudent = async (data: CreateStudentRequest) => {
    const payload: Record<string, unknown> = {
        sms_firstname:     data.firstname,
        sms_lastname:      data.lastname,
        sms_dateofbirth:   data.dateofbirth,
        sms_gender:        data.gender,
        sms_enrollmentdate: data.enrollmentdate,
    };
    if (data.email)        payload.sms_email   = data.email;
    if (data.phone)        payload.sms_phone   = data.phone;
    if (data.address)      payload.sms_address = data.address;
    if (data.rollnumber)   payload.sms_studentnumber = data.rollnumber;
    if (data.classid)      payload['sms_class@odata.bind']      = `/sms_classes(${data.classid})`;
    if (data.gradelevelid) payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${data.gradelevelid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateStudent = async (id: string, data: Partial<CreateStudentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.firstname      !== undefined) payload.sms_firstname      = data.firstname;
    if (data.lastname       !== undefined) payload.sms_lastname       = data.lastname;
    if (data.dateofbirth    !== undefined) payload.sms_dateofbirth    = data.dateofbirth;
    if (data.gender         !== undefined) payload.sms_gender         = data.gender;
    if (data.email          !== undefined) payload.sms_email          = data.email;
    if (data.phone          !== undefined) payload.sms_phone          = data.phone;
    if (data.address        !== undefined) payload.sms_address        = data.address;
    if (data.enrollmentdate !== undefined) payload.sms_enrollmentdate = data.enrollmentdate;
    if (data.rollnumber     !== undefined) payload.sms_studentnumber  = data.rollnumber;
    if (data.classid      !== undefined)
        payload['sms_class@odata.bind'] = data.classid ? `/sms_classes(${data.classid})` : null;
    if (data.gradelevelid !== undefined)
        payload['sms_gradelevel@odata.bind'] = data.gradelevelid ? `/sms_gradelevels(${data.gradelevelid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getStudentById(id);
};

export const deleteStudent = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getStudentStats = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_studentid,sms_studentstatus&$count=true`);
    const students = r.value ?? [];
    return {
        total:       r['@odata.count'] ?? students.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        active:      students.filter((s: any) => s.sms_studentstatus === 1).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graduated:   students.filter((s: any) => s.sms_studentstatus === 2).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inactive:    students.filter((s: any) => s.sms_studentstatus === 3).length,
    };
};

export const searchStudents = async (query: string) => {
    const q = query.replace(/'/g, "''");
    const filter = encodeURIComponent(
        `contains(sms_firstname,'${q}') or contains(sms_lastname,'${q}') or contains(sms_studentnumber,'${q}')`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$top=20`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapStudent(item));
};

export const getNextPage = async (nextLink: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(nextLink);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (r.value ?? []).map((row: any) => mapStudent(row));
    return { items, hasNextPage: !!r['@odata.nextLink'], nextLink: r['@odata.nextLink'] ?? null };
};
