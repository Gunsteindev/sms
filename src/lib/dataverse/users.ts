import { dataverseClient } from './client';

// sms_user fields: sms_userid, sms_name, sms_email, sms_userrole, sms_isactive,
//   sms_password, sms_relatedrecord, createdon
// userrole: 1=Admin  2=Teacher  3=Parent  4=Student
// relatedrecord: 1=Student  2=Teacher  3=Parent

export interface SmsUser {
    userid:        string;
    name:          string;
    email:         string;
    userrole:      number;
    userrolename:  string;
    isactive:      boolean;
    relatedrecord: number | null;
    createdon:     string;
}

export const USER_ROLES: Record<number, string> = {
    1: 'Admin', 2: 'Teacher', 3: 'Parent', 4: 'Student',
};

const TABLE  = 'sms_users';
const SELECT = 'sms_userid,sms_name,sms_email,sms_userrole,sms_isactive,sms_relatedrecord,createdon';

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
    };
}

export const getUsers = async (role?: number) => {
    const parts: string[] = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (role !== undefined) parts.push(`$filter=${encodeURIComponent(`sms_userrole eq ${role}`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((u: any) => mapUser(u));
};

export const getUserByEmail = async (email: string): Promise<SmsUser | null> => {
    const filter = encodeURIComponent(`sms_email eq '${email}'`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$top=1`);
    const items = r.value ?? [];
    return items.length ? mapUser(items[0]) : null;
};

export const getUserStats = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=sms_userrole,sms_isactive`);
    const users: SmsUser[] = (r.value ?? []).map(mapUser);
    return {
        total:    users.length,
        admins:   users.filter(u => u.userrole === 1).length,
        teachers: users.filter(u => u.userrole === 2).length,
        parents:  users.filter(u => u.userrole === 3).length,
        students: users.filter(u => u.userrole === 4).length,
        active:   users.filter(u => u.isactive).length,
    };
};
