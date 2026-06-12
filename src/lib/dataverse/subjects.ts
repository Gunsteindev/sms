import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_subjects';

// Verified Dataverse fields (sms_subject) — probed 2026-04-24:
// sms_subjectid, sms_name, sms_code (String),
// sms_description (Memo), sms_credithours (Integer), sms_passscore (Decimal),
// sms_type (Picklist: 922330000=Core, 922330001=Elective, 922330002=Extra),
// sms_gradelevel (Lookup → sms_gradelevels),
// sms_teacher    (Lookup → sms_teachers),
// createdon, modifiedon

export const SUBJECT_TYPES: Record<number, string> = {
    922330000: 'Core',
    922330001: 'Elective',
    922330002: 'Extra',
};

export interface Subject {
    subjectid:      string;
    name:           string;
    code:           string;
    description:    string;
    credithours:    number;
    passscore:      number | null;
    type:           number | null;
    typelabel:      string;
    gradelevelid:   string;
    gradelevelname: string;
    teacherid:      string;
    teachername:    string;
    createdon:      string;
    modifiedon:     string;
}

export interface CreateSubjectRequest {
    name:          string;
    code:          string;
    description?:  string;
    credithours?:  number;
    passscore?:    number;
    type?:         number;
    gradelevelid?: string;
    teacherid?:    string;
}

const SELECT = [
    'sms_subjectid', 'sms_name', 'sms_code',
    'sms_description', 'sms_credithours', 'sms_passscore', 'sms_type',
    '_sms_gradelevel_value', '_sms_teacher_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubject(item: any): Subject {
    const typeVal = item.sms_type ?? null;
    return {
        subjectid:      item.sms_subjectid   ?? '',
        name:           item.sms_name        ?? '',
        code:           item.sms_code        ?? '',
        description:    item.sms_description ?? '',
        credithours:    item.sms_credithours ?? 0,
        passscore:      item.sms_passscore   ?? null,
        type:           typeVal,
        typelabel:      typeVal !== null ? (SUBJECT_TYPES[typeVal] ?? String(typeVal)) : '',
        gradelevelid:   item._sms_gradelevel_value ?? '',
        gradelevelname: item['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        teacherid:      item._sms_teacher_value    ?? '',
        teachername:    item['_sms_teacher_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        createdon:      item.createdon       ?? '',
        modifiedon:     item.modifiedon      ?? '',
    };
}

export const getSubjects = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`, `$top=${top}`];
    if (search) {
        const q = search.replace(/'/g, "''");
        parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${q}') or contains(sms_code,'${q}')`)}`);
    }
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapSubject(item));
};

export const getSubjectById = async (id: string): Promise<Subject> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapSubject(r);
};

export const createSubject = async (data: CreateSubjectRequest) => {
    const payload: Record<string, unknown> = {
        sms_name: data.name,
        sms_code: data.code,
    };
    if (data.description  !== undefined) payload.sms_description = data.description;
    if (data.credithours  !== undefined) payload.sms_credithours = data.credithours;
    if (data.passscore    !== undefined) payload.sms_passscore   = data.passscore;
    if (data.type         !== undefined) payload.sms_type        = data.type;
    if (data.gradelevelid)  payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${data.gradelevelid})`;
    if (data.teacherid)     payload['sms_teacher@odata.bind']    = `/sms_teachers(${data.teacherid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateSubject = async (id: string, data: Partial<CreateSubjectRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.code        !== undefined) payload.sms_code        = data.code;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.credithours !== undefined) payload.sms_credithours = data.credithours;
    if (data.passscore   !== undefined) payload.sms_passscore   = data.passscore;
    if (data.type        !== undefined) payload.sms_type        = data.type;
    if (data.gradelevelid !== undefined)
        payload['sms_gradelevel@odata.bind'] = data.gradelevelid ? `/sms_gradelevels(${data.gradelevelid})` : null;
    if (data.teacherid !== undefined)
        payload['sms_teacher@odata.bind'] = data.teacherid ? `/sms_teachers(${data.teacherid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getSubjectById(id);
};

export const deleteSubject = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
