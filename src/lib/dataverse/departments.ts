import { dataverseClient } from "./client";

const TABLE = 'sms_departments';
// Fields: sms_departmentid, sms_name, sms_description
// Lookup: sms_headofdepartment → _sms_headofdepartment_value

export interface Department {
    departmentid: string;
    name: string;
    description: string;
    hodid: string;
    hodname: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateDepartmentRequest {
    name: string;
    description?: string;
    hodid?: string;
}

const SELECT = 'sms_departmentid,sms_name,sms_description,_sms_headofdepartment_value,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDepartment(item: any): Department {
    return {
        departmentid: item.sms_departmentid,
        name:         item.sms_name        ?? '',
        description:  item.sms_description ?? '',
        hodid:        item._sms_headofdepartment_value ?? '',
        hodname:      item['_sms_headofdepartment_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:    item.createdon  ?? '',
        modifiedon:   item.modifiedon ?? '',
    };
}

export const getDepartments = async (search?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapDepartment(item));
};

export const getDepartmentById = async (id: string): Promise<Department> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapDepartment(r);
};

export const createDepartment = async (data: CreateDepartmentRequest) => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.description) payload.sms_description = data.description;
    if (data.hodid)        payload['sms_headofdepartment@odata.bind'] = `/sms_teachers(${data.hodid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateDepartment = async (id: string, data: Partial<CreateDepartmentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.hodid       !== undefined) payload['sms_headofdepartment@odata.bind'] = `/sms_teachers(${data.hodid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getDepartmentById(id);
};

export const deleteDepartment = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
