import { dataverseClient } from './client';

const TABLE = 'sms_poolsessions';

// mode:   1=School, 2=Public
// shift:  1=Morning, 2=Afternoon, 3=Full Day
// status: 1=Open, 2=Closed

export interface PoolSession {
    sessionid:     string;
    name:          string;
    sessiondate:   string;
    mode:          number;
    shift:         number;
    studentscount: number;
    adultscount:   number;
    childrencount: number;
    entrycount:    number;
    entryfee:      number;
    totalrevenue:  number;
    status:        number;
    notes:         string;
    createdon:     string;
}

export interface CreateSessionRequest {
    name:           string;
    sessiondate:    string;
    mode:           number;
    shift:          number;
    studentscount?: number;
    adultscount?:   number;
    childrencount?: number;
    entrycount?:    number;
    entryfee?:      number;
    totalrevenue?:  number;
    status?:        number;
    notes?:         string;
}

const SELECT = 'sms_poolsessionid,sms_name,sms_sessiondate,sms_mode,sms_shift,sms_studentscount,sms_adultscount,sms_childrencount,sms_entrycount,sms_entryfee,sms_totalrevenue,sms_status,sms_notes,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(item: any): PoolSession {
    return {
        sessionid:     item.sms_poolsessionid,
        name:          item.sms_name          ?? '',
        sessiondate:   item.sms_sessiondate   ?? '',
        mode:          item.sms_mode          ?? 1,
        shift:         item.sms_shift         ?? 1,
        studentscount: item.sms_studentscount ?? 0,
        adultscount:   item.sms_adultscount   ?? 0,
        childrencount: item.sms_childrencount ?? 0,
        entrycount:    item.sms_entrycount    ?? 0,
        entryfee:      item.sms_entryfee      ?? 0,
        totalrevenue:  item.sms_totalrevenue  ?? 0,
        status:        item.sms_status        ?? 1,
        notes:         item.sms_notes         ?? '',
        createdon:     item.createdon         ?? '',
    };
}

export const getSessions = async (status?: number): Promise<PoolSession[]> => {
    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`];
    if (status) parts.push(`$filter=${encodeURIComponent(`sms_status eq ${status}`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapSession(i));
};

export const getSessionById = async (id: string): Promise<PoolSession> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapSession(r);
};

export const createSession = async (data: CreateSessionRequest): Promise<PoolSession> => {
    const payload: Record<string, unknown> = {
        sms_name:        data.name,
        sms_sessiondate: data.sessiondate,
        sms_mode:        data.mode,
        sms_shift:       data.shift,
    };
    if (data.studentscount !== undefined) payload.sms_studentscount = data.studentscount;
    if (data.adultscount   !== undefined) payload.sms_adultscount   = data.adultscount;
    if (data.childrencount !== undefined) payload.sms_childrencount = data.childrencount;
    if (data.entrycount    !== undefined) payload.sms_entrycount    = data.entrycount;
    if (data.entryfee      !== undefined) payload.sms_entryfee      = data.entryfee;
    if (data.totalrevenue  !== undefined) payload.sms_totalrevenue  = data.totalrevenue;
    if (data.status        !== undefined) payload.sms_status        = data.status;
    if (data.notes         !== undefined) payload.sms_notes         = data.notes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateSession = async (id: string, data: Partial<CreateSessionRequest>): Promise<PoolSession> => {
    const payload: Record<string, unknown> = {};
    if (data.name          !== undefined) payload.sms_name          = data.name;
    if (data.sessiondate   !== undefined) payload.sms_sessiondate   = data.sessiondate;
    if (data.mode          !== undefined) payload.sms_mode          = data.mode;
    if (data.shift         !== undefined) payload.sms_shift         = data.shift;
    if (data.studentscount !== undefined) payload.sms_studentscount = data.studentscount;
    if (data.adultscount   !== undefined) payload.sms_adultscount   = data.adultscount;
    if (data.childrencount !== undefined) payload.sms_childrencount = data.childrencount;
    if (data.entrycount    !== undefined) payload.sms_entrycount    = data.entrycount;
    if (data.entryfee      !== undefined) payload.sms_entryfee      = data.entryfee;
    if (data.totalrevenue  !== undefined) payload.sms_totalrevenue  = data.totalrevenue;
    if (data.status        !== undefined) payload.sms_status        = data.status;
    if (data.notes         !== undefined) payload.sms_notes         = data.notes;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getSessionById(id);
};

export const deleteSession = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
