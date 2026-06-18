import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_disciplinaries';

// Incident type: 1=Warning, 2=Detention, 3=Suspension (Dataverse picklist values)
export type IncidentType = 1 | 2 | 3;

export const INCIDENT_TYPE_LABELS: Record<number, string> = {
    1: 'Warning',
    2: 'Detention',
    3: 'Suspension',
};

export interface DisciplinaryRecord {
    disciplinaryid:   string;
    name:             string;
    date:             string;
    incidenttype:     IncidentType;
    incidenttypename: string;
    description:      string;
    action:           string;
    resolved:         boolean;
    parentnotified:   boolean;
    resolutiondate:   string;
    studentid:        string;
    studentname:      string;
    reportedbyid:     string;
    reportedbyname:   string;
    createdon:        string;
}

export interface CreateDisciplinaryRequest {
    date:             string;
    incidenttype:     IncidentType;
    description:      string;
    action?:          string;
    resolved?:        boolean;
    parentnotified?:  boolean;
    resolutiondate?:  string;
    studentid:        string;
    reportedbyid?:    string;
}

const SELECT = [
    'sms_disciplinaryid', 'sms_name', 'sms_incidentdate', 'sms_incidenttype',
    'sms_description', 'sms_actiontaken', 'sms_followuprequired', 'sms_parentnotified',
    '_sms_student_value', '_sms_reportedby_value',
    'createdon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(item: any): DisciplinaryRecord {
    const itype = item.sms_incidenttype ?? 1;
    return {
        disciplinaryid:   item.sms_disciplinaryid,
        name:             item.sms_name ?? '',
        date:             item.sms_incidentdate ? item.sms_incidentdate.slice(0, 10) : '',
        incidenttype:     itype as IncidentType,
        incidenttypename: INCIDENT_TYPE_LABELS[itype] ?? '',
        description:      item.sms_description ?? '',
        action:           item.sms_actiontaken ?? '',
        // sms_followuprequired is the inverse of "resolved": follow-up needed = not resolved
        resolved:         !(item.sms_followuprequired ?? true),
        parentnotified:   item.sms_parentnotified ?? false,
        resolutiondate:   '',  // no Dataverse field; UI shows but does not persist
        studentid:        item._sms_student_value ?? '',
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        reportedbyid:     item._sms_reportedby_value ?? '',
        reportedbyname:   item['_sms_reportedby_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon ?? '',
    };
}

export const getDisciplinaryRecords = async (studentid?: string) => {
    const parts: string[] = [
        `$select=${SELECT}`,
        `$orderby=sms_incidentdate desc`,
        `$top=200`,
    ];
    if (studentid) parts.push(`$filter=${encodeURIComponent(`_sms_student_value eq ${studentid}`)}`);

    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapRecord(item));
};

export const getDisciplinaryById = async (id: string): Promise<DisciplinaryRecord> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapRecord(r);
};

export const createDisciplinaryRecord = async (data: CreateDisciplinaryRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:            `${INCIDENT_TYPE_LABELS[data.incidenttype]} - ${data.date}`,
        sms_incidentdate:    data.date,
        sms_incidenttype:    data.incidenttype,
        sms_description:     data.description,
    };
    if (data.action)                     payload.sms_actiontaken       = data.action;
    if (data.resolved !== undefined)     payload.sms_followuprequired  = !data.resolved;
    if (data.parentnotified !== undefined) payload.sms_parentnotified  = data.parentnotified;
    if (data.studentid)       payload['sms_student@odata.bind']     = `/sms_students(${data.studentid})`;
    if (data.reportedbyid)    payload['sms_reportedby@odata.bind']  = `/sms_teachers(${data.reportedbyid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateDisciplinaryRecord = async (id: string, data: Partial<CreateDisciplinaryRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.date           !== undefined) payload.sms_incidentdate      = data.date;
    if (data.incidenttype   !== undefined) payload.sms_incidenttype      = data.incidenttype;
    if (data.description    !== undefined) payload.sms_description       = data.description;
    if (data.action         !== undefined) payload.sms_actiontaken       = data.action;
    if (data.resolved       !== undefined) payload.sms_followuprequired  = !data.resolved;
    if (data.parentnotified !== undefined) payload.sms_parentnotified    = data.parentnotified;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getDisciplinaryById(id);
};

export const deleteDisciplinaryRecord = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
