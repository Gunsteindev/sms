import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_activityparticipants';

// Status: 1=Active, 2=Withdrawn
// sms_student is a Lookup → sms_students. OData reads as _sms_student_value (GUID)
// and sms_studentname (auto-populated companion string). Write via 'sms_student@odata.bind'.

export interface ActivityParticipant {
    participantid:  string;
    name:           string;
    activityid:     string;
    activityname:   string;
    studentid:      string;
    studentname:    string;
    enrollmentdate: string;
    status:         number;
    createdon:      string;
}

export interface CreateParticipantRequest {
    activityid:     string;
    activityname:   string;
    studentid:      string;
    studentname:    string;
    enrollmentdate: string;
    status?:        number;
}

const SELECT = [
    'sms_activityparticipantid', 'sms_name',
    'sms_activityid', 'sms_activityname',
    '_sms_student_value',
    'sms_enrollmentdate', 'sms_activityparticipantstatus', 'createdon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipant(item: any): ActivityParticipant {
    return {
        participantid:  item.sms_activityparticipantid,
        name:           item.sms_name           ?? '',
        activityid:     item.sms_activityid     ?? '',
        activityname:   item.sms_activityname   ?? '',
        studentid:      item._sms_student_value ?? '',
        studentname:    item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        enrollmentdate: item.sms_enrollmentdate ?? '',
        status:         item.sms_activityparticipantstatus ?? 1,
        createdon:      item.createdon          ?? '',
    };
}

export const getParticipantsByActivity = async (activityid: string): Promise<ActivityParticipant[]> => {
    const filter = encodeURIComponent(`sms_activityid eq '${activityid}'`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=createdon asc&$top=500`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapParticipant);
};

export const createParticipant = async (data: CreateParticipantRequest): Promise<ActivityParticipant> => {
    const payload: Record<string, unknown> = {
        sms_name:           `${data.studentname} – ${data.activityname}`,
        sms_activityid:     data.activityid,
        sms_activityname:   data.activityname,
        'sms_student@odata.bind':    `/sms_students(${data.studentid})`,
        sms_enrollmentdate: data.enrollmentdate,
        sms_activityparticipantstatus: data.status ?? 1,
    };
    const r = await dataverseClient.post(TABLE, payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapParticipant(r as any);
};

export const deleteParticipant = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
