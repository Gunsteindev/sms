import { dataverseClient } from './client';

// sms_announcement fields:
//   sms_announcementid, sms_name, sms_message, sms_audience, sms_ispinned,
//   sms_publishdate, sms_expirydate, sms_class (lookup), sms_classname, createdon

// sms_audience: 1=All  2=Students  3=Teachers  4=Parents

export interface Announcement {
    announcementid: string;
    name:           string;
    message:        string;
    audience:       number;
    audiencename:   string;
    ispinned:       boolean;
    publishdate:    string;
    expirydate:     string;
    classid:        string;
    classname:      string;
    createdon:      string;
}

export interface CreateAnnouncementRequest {
    name:         string;
    message:      string;
    audience:     number;
    ispinned?:    boolean;
    publishdate?: string;
    expirydate?:  string;
    classid?:     string;
}

export const AUDIENCE: Record<number, string> = {
    1: 'All', 2: 'Students', 3: 'Teachers', 4: 'Parents',
};

const TABLE  = 'sms_announcements';
const SELECT = 'sms_announcementid,sms_name,sms_message,sms_audience,sms_ispinned,sms_publishdate,sms_expirydate,sms_classname,_sms_class_value,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnouncement(item: any): Announcement {
    const aud = item.sms_audience ?? 1;
    return {
        announcementid: item.sms_announcementid,
        name:           item.sms_name          ?? '',
        message:        item.sms_message       ?? '',
        audience:       aud,
        audiencename:   AUDIENCE[aud]           ?? 'All',
        ispinned:       item.sms_ispinned       ?? false,
        publishdate:    item.sms_publishdate    ?? item.createdon ?? '',
        expirydate:     item.sms_expirydate     ?? '',
        classid:        item._sms_class_value   ?? '',
        classname:      item.sms_classname      ?? '',
        createdon:      item.createdon          ?? '',
    };
}

export const getAnnouncements = async (opts?: { audience?: number; limit?: number; pinned?: boolean }) => {
    const parts: string[] = [`$select=${SELECT}`, `$orderby=sms_ispinned desc,sms_publishdate desc`];
    if (opts?.limit) parts.push(`$top=${opts.limit}`);

    const conds: string[] = [];
    if (opts?.audience !== undefined) conds.push(`(sms_audience eq 1 or sms_audience eq ${opts.audience})`);
    if (opts?.pinned   !== undefined) conds.push(`sms_ispinned eq ${opts.pinned}`);
    if (conds.length) parts.push(`$filter=${encodeURIComponent(conds.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((a: any) => mapAnnouncement(a));
};

export const getAnnouncementById = async (id: string): Promise<Announcement> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapAnnouncement(r);
};

export const createAnnouncement = async (data: CreateAnnouncementRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:        data.name,
        sms_message:     data.message,
        sms_audience:    data.audience,
        sms_ispinned:    data.ispinned ?? false,
        sms_publishdate: data.publishdate ?? new Date().toISOString(),
    };
    if (data.expirydate) payload.sms_expirydate = data.expirydate;
    if (data.classid)    payload['sms_class@odata.bind'] = `/sms_classes(${data.classid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateAnnouncement = async (id: string, data: Partial<CreateAnnouncementRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.message     !== undefined) payload.sms_message     = data.message;
    if (data.audience    !== undefined) payload.sms_audience    = data.audience;
    if (data.ispinned    !== undefined) payload.sms_ispinned    = data.ispinned;
    if (data.publishdate !== undefined) payload.sms_publishdate = data.publishdate;
    if (data.expirydate  !== undefined) payload.sms_expirydate  = data.expirydate;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getAnnouncementById(id);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
