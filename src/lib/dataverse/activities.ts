import { dataverseClient } from './client';

const TABLE = 'sms_activities';

// Category: 1=Sports, 2=Arts, 3=Music, 4=Drama, 5=Science, 6=Academic, 7=Cultural, 8=Other
// Day:      1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
// Status:   1=Active, 2=Inactive

export interface Activity {
    activityid:   string;
    name:         string;
    category:     number;
    coordinator:  string;
    venue:        string;
    day:          number;
    starttime:    string;
    endtime:      string;
    capacity:     number;
    enrolled:     number;
    description:  string;
    status:       number;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateActivityRequest {
    name:          string;
    category?:     number;
    coordinator?:  string;
    venue?:        string;
    day?:          number;
    starttime?:    string;
    endtime?:      string;
    capacity?:     number;
    enrolled?:     number;
    description?:  string;
    status?:       number;
}

const SELECT = 'sms_activityid,sms_name,sms_category,sms_coordinator,sms_venue,sms_day,sms_starttime,sms_endtime,sms_capacity,sms_enrolled,sms_description,sms_status,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapActivity(item: any): Activity {
    return {
        activityid:  item.sms_activityid,
        name:        item.sms_name        ?? '',
        category:    item.sms_category    ?? 8,
        coordinator: item.sms_coordinator ?? '',
        venue:       item.sms_venue       ?? '',
        day:         item.sms_day         ?? 1,
        starttime:   item.sms_starttime   ?? '',
        endtime:     item.sms_endtime     ?? '',
        capacity:    item.sms_capacity    ?? 0,
        enrolled:    item.sms_enrolled    ?? 0,
        description: item.sms_description ?? '',
        status:      item.sms_status      ?? 1,
        createdon:   item.createdon       ?? '',
        modifiedon:  item.modifiedon      ?? '',
    };
}

export const getActivities = async (category?: number, status?: number) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    const conds: string[] = [];
    if (category) conds.push(`sms_category eq ${category}`);
    if (status)   conds.push(`sms_status eq ${status}`);
    if (conds.length) parts.push(`$filter=${encodeURIComponent(conds.join(' and '))}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapActivity(i));
};

export const getActivityById = async (id: string): Promise<Activity> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapActivity(r);
};

export const createActivity = async (data: CreateActivityRequest) => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.category    !== undefined) payload.sms_category    = data.category;
    if (data.coordinator !== undefined) payload.sms_coordinator = data.coordinator;
    if (data.venue       !== undefined) payload.sms_venue       = data.venue;
    if (data.day         !== undefined) payload.sms_day         = data.day;
    if (data.starttime   !== undefined) payload.sms_starttime   = data.starttime;
    if (data.endtime     !== undefined) payload.sms_endtime     = data.endtime;
    if (data.capacity    !== undefined) payload.sms_capacity    = data.capacity;
    if (data.enrolled    !== undefined) payload.sms_enrolled    = data.enrolled;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.status      !== undefined) payload.sms_status      = data.status;
    return dataverseClient.post(TABLE, payload);
};

export const updateActivity = async (id: string, data: Partial<CreateActivityRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.category    !== undefined) payload.sms_category    = data.category;
    if (data.coordinator !== undefined) payload.sms_coordinator = data.coordinator;
    if (data.venue       !== undefined) payload.sms_venue       = data.venue;
    if (data.day         !== undefined) payload.sms_day         = data.day;
    if (data.starttime   !== undefined) payload.sms_starttime   = data.starttime;
    if (data.endtime     !== undefined) payload.sms_endtime     = data.endtime;
    if (data.capacity    !== undefined) payload.sms_capacity    = data.capacity;
    if (data.enrolled    !== undefined) payload.sms_enrolled    = data.enrolled;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.status      !== undefined) payload.sms_status      = data.status;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getActivityById(id);
};

export const deleteActivity = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
