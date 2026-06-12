import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_medical';

export interface MedicalRecord {
    medicalid:          string;
    name:               string;
    bloodtype:          string;
    allergies:          string;
    chronicconditions:  string;
    currentmedications: string;
    vaccinationrecords: string;
    lastcheckupdate:    string;
    emergencycontact:   string;
    emergencyphone:     string;
    studentid:          string;
    studentname:        string;
    createdon:          string;
    modifiedon:         string;
}

export interface CreateMedicalRequest {
    bloodtype?:          string;
    allergies?:          string;
    chronicconditions?:  string;
    currentmedications?: string;
    vaccinationrecords?: string;
    lastcheckupdate?:    string;
    emergencycontact?:   string;
    emergencyphone?:     string;
    studentid:           string;
}

const SELECT = [
    'sms_medicalid', 'sms_name', 'sms_bloodtype', 'sms_allergies',
    'sms_chronicconditions', 'sms_currentmedications', 'sms_vaccinationrecords',
    'sms_lastcheckupdate', 'sms_emergencycontact', 'sms_emergencyphone',
    '_sms_student_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMedical(item: any): MedicalRecord {
    return {
        medicalid:          item.sms_medicalid,
        name:               item.sms_name               ?? '',
        bloodtype:          item.sms_bloodtype           ?? '',
        allergies:          item.sms_allergies           ?? '',
        chronicconditions:  item.sms_chronicconditions   ?? '',
        currentmedications: item.sms_currentmedications  ?? '',
        vaccinationrecords: item.sms_vaccinationrecords  ?? '',
        lastcheckupdate:    item.sms_lastcheckupdate ? item.sms_lastcheckupdate.slice(0, 10) : '',
        emergencycontact:   item.sms_emergencycontact    ?? '',
        emergencyphone:     item.sms_emergencyphone      ?? '',
        studentid:          item._sms_student_value      ?? '',
        studentname:        item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:          item.createdon               ?? '',
        modifiedon:         item.modifiedon              ?? '',
    };
}

export const getMedicalByStudent = async (studentid: string): Promise<MedicalRecord | null> => {
    const filter = encodeURIComponent(`_sms_student_value eq ${studentid}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$top=1`);
    const items = r.value ?? [];
    return items.length > 0 ? mapMedical(items[0]) : null;
};

export const getMedicalById = async (id: string): Promise<MedicalRecord> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapMedical(r);
};

export const createMedicalRecord = async (data: CreateMedicalRequest) => {
    const payload: Record<string, unknown> = {
        sms_name: `Medical Record - ${data.studentid}`,
    };
    if (data.bloodtype)          payload.sms_bloodtype          = data.bloodtype;
    if (data.allergies)          payload.sms_allergies          = data.allergies;
    if (data.chronicconditions)  payload.sms_chronicconditions  = data.chronicconditions;
    if (data.currentmedications) payload.sms_currentmedications = data.currentmedications;
    if (data.vaccinationrecords) payload.sms_vaccinationrecords = data.vaccinationrecords;
    if (data.lastcheckupdate)    payload.sms_lastcheckupdate    = data.lastcheckupdate;
    if (data.emergencycontact)   payload.sms_emergencycontact   = data.emergencycontact;
    if (data.emergencyphone)     payload.sms_emergencyphone     = data.emergencyphone;
    if (data.studentid)          payload['sms_student@odata.bind'] = `/sms_students(${data.studentid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateMedicalRecord = async (id: string, data: Partial<CreateMedicalRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.bloodtype          !== undefined) payload.sms_bloodtype          = data.bloodtype;
    if (data.allergies          !== undefined) payload.sms_allergies          = data.allergies;
    if (data.chronicconditions  !== undefined) payload.sms_chronicconditions  = data.chronicconditions;
    if (data.currentmedications !== undefined) payload.sms_currentmedications = data.currentmedications;
    if (data.vaccinationrecords !== undefined) payload.sms_vaccinationrecords = data.vaccinationrecords;
    if (data.lastcheckupdate    !== undefined) payload.sms_lastcheckupdate    = data.lastcheckupdate;
    if (data.emergencycontact   !== undefined) payload.sms_emergencycontact   = data.emergencycontact;
    if (data.emergencyphone     !== undefined) payload.sms_emergencyphone     = data.emergencyphone;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getMedicalById(id);
};

export const deleteMedicalRecord = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
