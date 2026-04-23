import { dataverseClient } from "./client";

const TABLE = 'sms_teachers';

// Verified Dataverse fields (sms_teachers) — discovered 2026-04-21:
// sms_teacherid, sms_firstname, sms_lastname, sms_name,
// sms_dateofbirth (DateTime), sms_gender (1=Male, 2=Female),
// sms_email, sms_phone, sms_address,
// sms_hiredate (DateTime), sms_qualification, sms_specialization,
// sms_teacherstatus (1=Active, 2=On Leave, 3=Resigned),
// sms_employeeid, sms_contracttype, sms_employmentstatus, sms_salary,
// _sms_class_value (Lookup → sms_classes),
// createdon, modifiedon

export interface Teacher {
    teacherid:      string;
    firstname:      string;
    lastname:       string;
    dateofbirth:    string;
    gender:         number;
    email:          string;
    phone:          string;
    address:        string;
    hiredate:       string;
    qualification:  string;
    specialization: string;
    employeeid:     string;
    statuscode:     number;
    classid:        string;
    classname:      string;
    createdon:      string;
    modifiedon:     string;
}

export interface CreateTeacherRequest {
    firstname:      string;
    lastname:       string;
    dateofbirth:    string;
    gender:         number;
    email:          string;
    phone?:         string;
    address?:       string;
    hiredate:       string;
    qualification:  string;
    specialization: string;
    employeeid?:    string;
}

export interface TeacherFilters {
    search?:   string;
    status?:   number;
    page?:     number;
    pageSize?: number;
}

const SELECT = [
    'sms_teacherid', 'sms_firstname', 'sms_lastname',
    'sms_dateofbirth', 'sms_gender',
    'sms_email', 'sms_phone', 'sms_address',
    'sms_hiredate', 'sms_qualification', 'sms_specialization',
    'sms_employeeid', 'sms_teacherstatus',
    '_sms_class_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeacher(item: any): Teacher {
    return {
        teacherid:      item.sms_teacherid   ?? '',
        firstname:      item.sms_firstname   ?? '',
        lastname:       item.sms_lastname    ?? '',
        dateofbirth:    item.sms_dateofbirth ? (item.sms_dateofbirth as string).slice(0, 10) : '',
        gender:         item.sms_gender      ?? 1,
        email:          item.sms_email       ?? '',
        phone:          item.sms_phone       ?? '',
        address:        item.sms_address     ?? '',
        hiredate:       item.sms_hiredate    ? (item.sms_hiredate as string).slice(0, 10) : '',
        qualification:  item.sms_qualification  ?? '',
        specialization: item.sms_specialization ?? '',
        employeeid:     item.sms_employeeid  ?? '',
        statuscode:     item.sms_teacherstatus ?? 1,
        classid:        item._sms_class_value ?? '',
        classname:      item['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:      item.createdon       ?? '',
        modifiedon:     item.modifiedon      ?? '',
    };
}

export const getTeachers = async (filters?: TeacherFilters) => {
    const parts: string[] = [`$select=${SELECT}`, `$orderby=sms_firstname asc`];
    const pageSize = filters?.pageSize ?? 50;
    parts.push(`$top=${pageSize}`);

    const conditions: string[] = [];
    if (filters?.search) {
        const q = filters.search.replace(/'/g, "''");
        conditions.push(`contains(sms_firstname,'${q}') or contains(sms_lastname,'${q}')`);
    }
    if (filters?.status !== undefined) conditions.push(`sms_teacherstatus eq ${filters.status}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (response.value ?? []).map((r: any) => mapTeacher(r));
    return {
        items,
        totalCount: response['@odata.count'] ?? items.length,
        page:       filters?.page ?? 1,
        pageSize,
        hasNextPage: !!response['@odata.nextLink'],
        nextLink:    response['@odata.nextLink'] ?? null,
    };
};

export const getTeacherById = async (id: string): Promise<Teacher> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapTeacher(r);
};

export const createTeacher = async (data: CreateTeacherRequest) => {
    const payload: Record<string, unknown> = {
        sms_firstname:      data.firstname,
        sms_lastname:       data.lastname,
        sms_gender:         data.gender,
        sms_email:          data.email,
        sms_qualification:  data.qualification,
        sms_specialization: data.specialization,
    };
    if (data.dateofbirth) payload.sms_dateofbirth = data.dateofbirth;
    if (data.hiredate)    payload.sms_hiredate    = data.hiredate;
    if (data.phone)       payload.sms_phone       = data.phone;
    if (data.address)     payload.sms_address     = data.address;
    if (data.employeeid)  payload.sms_employeeid  = data.employeeid;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateTeacher = async (id: string, data: Partial<CreateTeacherRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.firstname      !== undefined) payload.sms_firstname      = data.firstname;
    if (data.lastname       !== undefined) payload.sms_lastname       = data.lastname;
    if (data.dateofbirth    !== undefined) payload.sms_dateofbirth    = data.dateofbirth;
    if (data.gender         !== undefined) payload.sms_gender         = data.gender;
    if (data.email          !== undefined) payload.sms_email          = data.email;
    if (data.phone          !== undefined) payload.sms_phone          = data.phone;
    if (data.address        !== undefined) payload.sms_address        = data.address;
    if (data.hiredate       !== undefined) payload.sms_hiredate       = data.hiredate;
    if (data.qualification  !== undefined) payload.sms_qualification  = data.qualification;
    if (data.specialization !== undefined) payload.sms_specialization = data.specialization;
    if (data.employeeid     !== undefined) payload.sms_employeeid     = data.employeeid;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getTeacherById(id);
};

export const deleteTeacher = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getTeacherStats = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_teacherid,sms_teacherstatus,sms_specialization&$count=true`);
    const teachers = r.value ?? [];

    const bySpecialization: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teachers.forEach((t: any) => {
        if (t.sms_specialization) {
            bySpecialization[t.sms_specialization] = (bySpecialization[t.sms_specialization] || 0) + 1;
        }
    });

    return {
        total:    r['@odata.count'] ?? teachers.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        active:   teachers.filter((t: any) => t.sms_teacherstatus === 1).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onLeave:  teachers.filter((t: any) => t.sms_teacherstatus === 2).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resigned: teachers.filter((t: any) => t.sms_teacherstatus === 3).length,
        bySpecialization,
    };
};

export const getTeacherClasses = async (teacherId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(
        `sms_classes?$select=sms_classid,sms_name,sms_gradelevel,sms_roomnumber&$filter=_sms_classteacher_value eq ${teacherId}&$orderby=sms_name asc`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => ({
        classid:    item.sms_classid,
        classname:  item.sms_name       ?? '',
        gradelevel: item.sms_gradelevel ?? 0,
        roomnumber: item.sms_roomnumber ?? '',
    }));
};

export const searchTeachers = async (query: string) => {
    const q = query.replace(/'/g, "''");
    const filter = encodeURIComponent(`contains(sms_firstname,'${q}') or contains(sms_lastname,'${q}')`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_teacherid,sms_firstname,sms_lastname,sms_email&$filter=${filter}&$top=20`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => ({
        teacherid: item.sms_teacherid,
        firstname: item.sms_firstname ?? '',
        lastname:  item.sms_lastname  ?? '',
        email:     item.sms_email     ?? '',
    }));
};
