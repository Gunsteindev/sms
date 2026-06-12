import bcrypt from 'bcryptjs';
import { dataverseClient, type DvList } from './client';

// sms_users fields: sms_userid, sms_name, sms_email, sms_userrole (choice),
//   sms_password, sms_isactive, sms_relatedrecord, createdon
//
// userrole option set values (must match Dataverse picklist):
//   1=Admin  2=Teacher  3=Finance  4=Inventory Manager
//   5=Transport Manager  6=Pool Attendant  7=Parent

export interface SmsUser {
    userid:        string;
    name:          string;
    email:         string;
    userrole:      number;
    userrolename:  string;
    isactive:      boolean;
    relatedrecord: string | null;
    createdon:     string;
    // multi-tenancy: the school this user belongs to
    schoolid?:     string;
}

export const USER_ROLES: Record<number, string> = {
    1: 'Admin',
    2: 'Teacher',
    3: 'Finance',
    4: 'Inventory Manager',
    5: 'Transport Manager',
    6: 'Pool Attendant',
    7: 'Parent',
    8: 'Kitchen Attendant',
};

export interface CreateUserRequest {
    name:          string;
    email:         string;
    password:      string;
    userrole:      number;
    relatedrecord?: string;
}

export interface UpdateUserRequest {
    name?:          string;
    email?:         string;
    password?:      string;
    userrole?:      number;
    isactive?:      boolean;
    relatedrecord?: string;
}

const TABLE           = 'sms_users';
// _sms_school_value is the lookup GUID for multi-tenancy
const SELECT          = 'sms_userid,sms_name,sms_email,sms_userrole,sms_isactive,sms_relatedrecord,createdon,_sms_school_value';
const SELECT_WITH_PWD = SELECT + ',sms_password';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(item: any): SmsUser {
    const role = item.sms_userrole ?? 0;
    return {
        userid:        item.sms_userid,
        name:          item.sms_name          ?? '',
        email:         item.sms_email         ?? '',
        userrole:      role,
        userrolename:  USER_ROLES[role]        ?? 'Unknown',
        isactive:      item.sms_isactive       ?? false,
        relatedrecord: item.sms_relatedrecord  ?? null,
        createdon:     item.createdon          ?? '',
        schoolid:      item._sms_school_value  ?? undefined,
    };
}

export const getUsers = async (role?: number): Promise<SmsUser[]> => {
    const parts: string[] = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (role !== undefined) parts.push(`$filter=${encodeURIComponent(`sms_userrole eq ${role}`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((u: any) => mapUser(u));
};

export const getUserById = async (id: string): Promise<SmsUser> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapUser(r);
};

export const getUserByEmail = async (email: string): Promise<SmsUser | null> => {
    const filter = encodeURIComponent(`sms_email eq '${email}'`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$top=1`);
    const items = r.value ?? [];
    return items.length ? mapUser(items[0]) : null;
};

// For login only — fetches password hash alongside user record
export const getUserForAuth = async (email: string): Promise<(SmsUser & { passwordhash: string }) | null> => {
    const filter = encodeURIComponent(`sms_email eq '${email}' and sms_isactive eq true`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT_WITH_PWD}&$filter=${filter}&$top=1`);
    const items = r.value ?? [];
    if (!items.length) return null;
    return { ...mapUser(items[0]), passwordhash: (items[0].sms_password as string) ?? '' };
};

export const createUser = async (data: CreateUserRequest): Promise<SmsUser> => {
    const hash = await bcrypt.hash(data.password, 12);
    const payload: Record<string, unknown> = {
        sms_name:     data.name,
        sms_email:    data.email,
        sms_password: hash,
        sms_userrole: data.userrole,
        sms_isactive: true,
    };
    if (data.relatedrecord) payload.sms_relatedrecord = data.relatedrecord;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(TABLE, payload);
    return mapUser(result);
};

export const updateUser = async (id: string, data: UpdateUserRequest): Promise<SmsUser> => {
    const payload: Record<string, unknown> = {};
    if (data.name          !== undefined) payload.sms_name          = data.name;
    if (data.email         !== undefined) payload.sms_email         = data.email;
    if (data.userrole      !== undefined) payload.sms_userrole      = data.userrole;
    if (data.isactive      !== undefined) payload.sms_isactive      = data.isactive;
    if (data.relatedrecord !== undefined) payload.sms_relatedrecord = data.relatedrecord;
    if (data.password) payload.sms_password = await bcrypt.hash(data.password, 12);
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getUserById(id);
};

export const deleteUser = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getUserStats = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r   = await dataverseClient.get<DvList>(`${TABLE}?$select=sms_userrole,sms_isactive`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all: SmsUser[] = (r.value ?? []).map((u: any) => mapUser(u));
    return {
        total:  all.length,
        active: all.filter(u => u.isactive).length,
        byRole: Object.fromEntries(
            Object.entries(USER_ROLES).map(([k]) => [
                USER_ROLES[Number(k)],
                all.filter(u => u.userrole === Number(k)).length,
            ])
        ),
    };
};

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> =>
    bcrypt.compare(plain, hash);
