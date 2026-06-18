import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_timetables';

// Verified Dataverse fields (sms_timetables) — discovered 2026-04-21:
// sms_timetableid, sms_name,
// sms_dayofweek (1=Mon … 7=Sun, option-set with FormattedValue),
// sms_starttime, sms_endtime (DateTime — store as 1970-01-01T{HH:MM}:00Z),
// sms_roomnumber, sms_periodnumber,
// _sms_class_value   (Lookup → sms_classes),
// _sms_subject_value (Lookup → sms_subjects),
// _sms_teacher_value (Lookup → sms_teachers),
// _sms_academicyear_value (Lookup → sms_academicyears),
// createdon, modifiedon

export interface TimetableEntry {
    timetableid:   string;
    name:          string;
    dayofweek:     number;
    dayofweekname: string;
    starttime:     string;   // "HH:MM" extracted from ISO
    endtime:       string;   // "HH:MM" extracted from ISO
    roomnumber:    string;
    periodnumber:  number | null;
    classid:       string;
    classname:     string;
    subjectid:     string;
    subjectname:   string;
    teacherid:     string;
    teachername:   string;
    createdon:     string;
    modifiedon:    string;
}

export interface CreateTimetableEntryRequest {
    dayofweek:    number;
    starttime:    string;    // "HH:MM" or ISO
    endtime:      string;    // "HH:MM" or ISO
    roomnumber?:  string;
    periodnumber?: number;
    classid?:     string;
    subjectid?:   string;
    teacherid?:   string;
}

export const DAYS_OF_WEEK: Record<number, string> = {
    1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const SELECT = [
    'sms_timetableid', 'sms_name',
    'sms_dayofweek', 'sms_starttime', 'sms_endtime',
    'sms_roomnumber', 'sms_periodnumber',
    '_sms_class_value', '_sms_subject_value', '_sms_teacher_value',
    'createdon', 'modifiedon',
].join(',');

function extractTime(iso: string | null | undefined): string {
    if (!iso) return '';
    if (iso.includes('T')) return iso.slice(11, 16); // HH:MM
    return iso.slice(0, 5);
}

function toISO(t: string): string {
    if (!t) return t;
    return t.includes('T') ? t : `1970-01-01T${t}:00Z`;
}

function buildEntryName(dayofweek: number, periodnumber: number | null | undefined, starttime: string, endtime: string): string {
    const day    = DAYS_OF_WEEK[dayofweek] ?? `Day ${dayofweek}`;
    const period = periodnumber ? ` P${periodnumber}` : '';
    return `${day}${period} (${extractTime(starttime)}-${extractTime(endtime)})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(item: any): TimetableEntry {
    return {
        timetableid:   item.sms_timetableid   ?? '',
        name:          item.sms_name          ?? '',
        dayofweek:     item.sms_dayofweek     ?? 1,
        dayofweekname: item['sms_dayofweek@OData.Community.Display.V1.FormattedValue']
                       ?? DAYS_OF_WEEK[item.sms_dayofweek] ?? '',
        starttime:     extractTime(item.sms_starttime),
        endtime:       extractTime(item.sms_endtime),
        roomnumber:    item.sms_roomnumber    ?? '',
        periodnumber:  item.sms_periodnumber  ?? null,
        classid:       item._sms_class_value  ?? '',
        classname:     item['_sms_class_value@OData.Community.Display.V1.FormattedValue']   ?? '',
        subjectid:     item._sms_subject_value ?? '',
        subjectname:   item['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        teacherid:     item._sms_teacher_value ?? '',
        teachername:   item['_sms_teacher_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:     item.createdon         ?? '',
        modifiedon:    item.modifiedon        ?? '',
    };
}

export const getTimetable = async (dayofweek?: number, classid?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_dayofweek asc,sms_starttime asc`];
    const conditions: string[] = [];
    if (dayofweek) conditions.push(`sms_dayofweek eq ${dayofweek}`);
    if (classid)   conditions.push(`_sms_class_value eq ${classid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapEntry(item));
};

export const getTimetableEntryById = async (id: string): Promise<TimetableEntry> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapEntry(r);
};

export const createTimetableEntry = async (data: CreateTimetableEntryRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:      buildEntryName(data.dayofweek, data.periodnumber, data.starttime, data.endtime),
        sms_dayofweek: data.dayofweek,
        sms_starttime: toISO(data.starttime),
        sms_endtime:   toISO(data.endtime),
    };
    if (data.roomnumber   !== undefined) payload.sms_roomnumber  = data.roomnumber;
    if (data.periodnumber !== undefined) payload.sms_periodnumber = data.periodnumber;
    if (data.classid)   payload['sms_class@odata.bind']   = `/sms_classes(${data.classid})`;
    if (data.subjectid) payload['sms_subject@odata.bind'] = `/sms_subjects(${data.subjectid})`;
    if (data.teacherid) payload['sms_teacher@odata.bind'] = `/sms_teachers(${data.teacherid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateTimetableEntry = async (id: string, data: Partial<CreateTimetableEntryRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.dayofweek    !== undefined) payload.sms_dayofweek   = data.dayofweek;
    if (data.starttime    !== undefined) payload.sms_starttime   = toISO(data.starttime);
    if (data.endtime      !== undefined) payload.sms_endtime     = toISO(data.endtime);
    if (data.roomnumber   !== undefined) payload.sms_roomnumber  = data.roomnumber;
    if (data.periodnumber !== undefined) payload.sms_periodnumber = data.periodnumber;
    if (data.dayofweek !== undefined || data.periodnumber !== undefined || data.starttime !== undefined || data.endtime !== undefined) {
        const existing = await getTimetableEntryById(id);
        payload.sms_name = buildEntryName(
            data.dayofweek    ?? existing.dayofweek,
            data.periodnumber !== undefined ? data.periodnumber : existing.periodnumber,
            data.starttime    ?? existing.starttime,
            data.endtime      ?? existing.endtime,
        );
    }
    if (data.classid   !== undefined)
        payload['sms_class@odata.bind']   = data.classid   ? `/sms_classes(${data.classid})`   : null;
    if (data.subjectid !== undefined)
        payload['sms_subject@odata.bind'] = data.subjectid ? `/sms_subjects(${data.subjectid})` : null;
    if (data.teacherid !== undefined)
        payload['sms_teacher@odata.bind'] = data.teacherid ? `/sms_teachers(${data.teacherid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getTimetableEntryById(id);
};

export const deleteTimetableEntry = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
