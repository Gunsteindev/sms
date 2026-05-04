import { dataverseClient } from "./client";

const TABLE = 'sms_gradelevels';
// Verified Dataverse fields (EntityDefinitions metadata 2026-04-23):
//   sms_gradelevelid, sms_name, sms_ordernumber (Integer),
//   sms_code (String), sms_description (String),
//   statecode, statuscode, createdon, modifiedon
// NOTE: sms_level does NOT exist — field is sms_ordernumber

export interface GradeLevel {
    gradelevelid: string;
    name:         string;
    ordernumber:  number;
    code:         string;
    description:  string;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateGradeLevelRequest {
    name:        string;
    ordernumber: number;
    code?:       string;
    description?: string;
}

const SELECT = 'sms_gradelevelid,sms_name,sms_ordernumber,sms_code,sms_description,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGradeLevel(item: any): GradeLevel {
    return {
        gradelevelid: item.sms_gradelevelid,
        name:         item.sms_name         ?? '',
        ordernumber:  item.sms_ordernumber  ?? 0,
        code:         item.sms_code         ?? '',
        description:  item.sms_description  ?? '',
        createdon:    item.createdon         ?? '',
        modifiedon:   item.modifiedon        ?? '',
    };
}

export const getGradeLevels = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_ordernumber asc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapGradeLevel(item));
};

export const getGradeLevelById = async (id: string): Promise<GradeLevel> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapGradeLevel(r);
};

export const createGradeLevel = async (data: CreateGradeLevelRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:        data.name,
        sms_ordernumber: data.ordernumber,
    };
    if (data.code)        payload.sms_code        = data.code;
    if (data.description) payload.sms_description = data.description;
    return dataverseClient.post(TABLE, payload);
};

export const updateGradeLevel = async (id: string, data: Partial<CreateGradeLevelRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.ordernumber !== undefined) payload.sms_ordernumber = data.ordernumber;
    if (data.code        !== undefined) payload.sms_code        = data.code;
    if (data.description !== undefined) payload.sms_description = data.description;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getGradeLevelById(id);
};

export const deleteGradeLevel = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
