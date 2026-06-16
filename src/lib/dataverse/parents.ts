import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_parents';
// Verified Dataverse fields (sms_parent) — probed 2026-04-24:
// sms_parentid, sms_firstname, sms_lastname, sms_name,
// sms_email, sms_phone, sms_address,
// sms_relationship (Picklist: 1=Father, 2=Mother, 3=Guardian),
// sms_occupation, sms_nationalid, sms_emergencycontact,
// createdon, modifiedon

export interface Parent {
    parentid:     string;
    firstname:    string;
    lastname:     string;
    fullname:     string;
    email:        string;
    phone:        string;
    relationship: number;
    address:      string;
    occupation:   string;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateParentRequest {
    firstname:    string;
    lastname:     string;
    email?:       string;
    phone?:       string;
    relationship?: number;
    address?:     string;
    occupation?:  string;
}

export const PARENT_RELATIONSHIPS: Record<number, string> = {
    1: 'Father',
    2: 'Mother',
    3: 'Guardian',
};

const SELECT = 'sms_parentid,sms_name,sms_firstname,sms_lastname,sms_email,sms_phone,sms_relationship,sms_address,sms_occupation,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParent(item: any): Parent {
    return {
        parentid:     item.sms_parentid,
        firstname:    item.sms_firstname    ?? '',
        lastname:     item.sms_lastname     ?? '',
        fullname:     item.sms_name         ?? `${item.sms_firstname ?? ''} ${item.sms_lastname ?? ''}`.trim(),
        email:        item.sms_email        ?? '',
        phone:        item.sms_phone        ?? '',
        relationship: item.sms_relationship ?? 3,
        address:      item.sms_address      ?? '',
        occupation:   item.sms_occupation   ?? '',
        createdon:    item.createdon        ?? '',
        modifiedon:   item.modifiedon       ?? '',
    };
}

export const getParents = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_lastname asc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_firstname,'${search}') or contains(sms_lastname,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapParent(item));
};

export const getParentById = async (id: string): Promise<Parent> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapParent(r);
};

export const createParent = async (data: CreateParentRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:      `${data.firstname} ${data.lastname}`.trim(),
        sms_firstname: data.firstname,
        sms_lastname:  data.lastname,
    };
    if (data.email        !== undefined) payload.sms_email        = data.email;
    if (data.phone        !== undefined) payload.sms_phone        = data.phone;
    if (data.relationship !== undefined) payload.sms_relationship = data.relationship;
    if (data.address      !== undefined) payload.sms_address      = data.address;
    if (data.occupation   !== undefined) payload.sms_occupation   = data.occupation;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateParent = async (id: string, data: Partial<CreateParentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.firstname    !== undefined) payload.sms_firstname    = data.firstname;
    if (data.lastname     !== undefined) payload.sms_lastname     = data.lastname;
    if (data.firstname !== undefined || data.lastname !== undefined) {
        const existing = await getParentById(id);
        payload.sms_name = `${data.firstname ?? existing.firstname} ${data.lastname ?? existing.lastname}`.trim();
    }
    if (data.email        !== undefined) payload.sms_email        = data.email;
    if (data.phone        !== undefined) payload.sms_phone        = data.phone;
    if (data.relationship !== undefined) payload.sms_relationship = data.relationship;
    if (data.address      !== undefined) payload.sms_address      = data.address;
    if (data.occupation   !== undefined) payload.sms_occupation   = data.occupation;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getParentById(id);
};

export const deleteParent = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getParentByEmail = async (email: string): Promise<Parent | null> => {
    const filter = encodeURIComponent(`sms_email eq '${email}'`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$top=1`);
    const items = r.value ?? [];
    return items.length ? mapParent(items[0]) : null;
};
