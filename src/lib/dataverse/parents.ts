import { dataverseClient } from "./client";

const TABLE = 'sms_parents';
// Fields: sms_parentid, sms_firstname, sms_lastname, sms_emailaddress1,
//         sms_telephone1, sms_relationship (1=Father,2=Mother,3=Guardian,4=Other),
//         sms_address1_line1, sms_name

export interface Parent {
    parentid: string;
    firstname: string;
    lastname: string;
    fullname: string;
    emailaddress1: string;
    telephone1: string;
    relationship: number;
    address1_line1: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateParentRequest {
    firstname: string;
    lastname: string;
    emailaddress1?: string;
    telephone1?: string;
    relationship?: number;
    address1_line1?: string;
}

export const PARENT_RELATIONSHIPS: Record<number, string> = {
    1: 'Father',
    2: 'Mother',
    3: 'Guardian',
    4: 'Other',
};

const SELECT = 'sms_parentid,sms_name,sms_firstname,sms_lastname,sms_emailaddress1,sms_telephone1,sms_relationship,sms_address1_line1,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParent(item: any): Parent {
    return {
        parentid:       item.sms_parentid,
        firstname:      item.sms_firstname     ?? '',
        lastname:       item.sms_lastname      ?? '',
        fullname:       item.sms_name          ?? `${item.sms_firstname ?? ''} ${item.sms_lastname ?? ''}`.trim(),
        emailaddress1:  item.sms_emailaddress1 ?? '',
        telephone1:     item.sms_telephone1    ?? '',
        relationship:   item.sms_relationship  ?? 3,
        address1_line1: item.sms_address1_line1 ?? '',
        createdon:      item.createdon  ?? '',
        modifiedon:     item.modifiedon ?? '',
    };
}

export const getParents = async (search?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_lastname asc`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_firstname,'${search}') or contains(sms_lastname,'${search}')`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapParent(item));
};

export const getParentById = async (id: string): Promise<Parent> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapParent(r);
};

export const createParent = async (data: CreateParentRequest) => {
    const payload: Record<string, unknown> = {
        sms_firstname: data.firstname,
        sms_lastname:  data.lastname,
    };
    if (data.emailaddress1  !== undefined) payload.sms_emailaddress1  = data.emailaddress1;
    if (data.telephone1     !== undefined) payload.sms_telephone1     = data.telephone1;
    if (data.relationship   !== undefined) payload.sms_relationship   = data.relationship;
    if (data.address1_line1 !== undefined) payload.sms_address1_line1 = data.address1_line1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateParent = async (id: string, data: Partial<CreateParentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.firstname      !== undefined) payload.sms_firstname      = data.firstname;
    if (data.lastname       !== undefined) payload.sms_lastname       = data.lastname;
    if (data.emailaddress1  !== undefined) payload.sms_emailaddress1  = data.emailaddress1;
    if (data.telephone1     !== undefined) payload.sms_telephone1     = data.telephone1;
    if (data.relationship   !== undefined) payload.sms_relationship   = data.relationship;
    if (data.address1_line1 !== undefined) payload.sms_address1_line1 = data.address1_line1;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getParentById(id);
};

export const deleteParent = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
