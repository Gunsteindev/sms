import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_exams';
// Verified Dataverse fields (sms_exams) — discovered 2026-04-22:
// sms_examid, sms_name,
// sms_examcode        (String)
// sms_examtype        (OptionSet: 1=Quiz, 2=Midterm, 3=Final, 4=Practical)
// sms_startdate       (DateOnly → returns ISO datetime, slice to 10)
// sms_enddate         (DateOnly → returns ISO datetime, slice to 10)
// sms_totalmarks      (Decimal)
// sms_passmarks       (Decimal)
// sms_venue           (String)
// sms_weightpercent   (Decimal)
// _sms_academicyear_value (Lookup → sms_academicyears)
// _sms_class_value        (Lookup → sms_classes)
// _sms_subject_value      (Lookup → sms_subjects)
// _sms_term_value         (Lookup → sms_terms)
// createdon, modifiedon

export interface Exam {
    examid:          string;
    name:            string;
    examcode:        string;
    examtype:        number;
    examtypename:    string;
    startdate:       string;
    enddate:         string;
    totalmarks:      number | null;
    passmarks:       number | null;
    venue:           string;
    weightpercent:   number | null;
    academicyearid:  string;
    academicyearname: string;
    classid:         string;
    classname:       string;
    subjectid:       string;
    subjectname:     string;
    termid:          string;
    termname:        string;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateExamRequest {
    name:           string;
    examcode?:      string;
    examtype:       number;
    startdate:      string;
    enddate:        string;
    totalmarks?:    number;
    passmarks?:     number;
    venue?:         string;
    weightpercent?: number;
    academicyearid?: string;
    classid?:       string;
    subjectid?:     string;
    termid?:        string;
}

export const EXAM_TYPES: Record<number, string> = { 1: 'Quiz', 2: 'Midterm', 3: 'Final', 4: 'Practical' };

const SELECT = [
    'sms_examid', 'sms_name', 'sms_examcode', 'sms_examtype',
    'sms_startdate', 'sms_enddate',
    'sms_totalmarks', 'sms_passmarks', 'sms_venue', 'sms_weightpercent',
    '_sms_academicyear_value', '_sms_class_value', '_sms_subject_value', '_sms_term_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExam(item: any): Exam {
    return {
        examid:           item.sms_examid,
        name:             item.sms_name          ?? '',
        examcode:         item.sms_examcode       ?? '',
        examtype:         item.sms_examtype       ?? 1,
        examtypename:     item['sms_examtype@OData.Community.Display.V1.FormattedValue'] ?? '',
        startdate:        item.sms_startdate ? item.sms_startdate.slice(0, 10) : '',
        enddate:          item.sms_enddate   ? item.sms_enddate.slice(0, 10)   : '',
        totalmarks:       item.sms_totalmarks    ?? null,
        passmarks:        item.sms_passmarks     ?? null,
        venue:            item.sms_venue         ?? '',
        weightpercent:    item.sms_weightpercent ?? null,
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        classid:          item._sms_class_value  ?? '',
        classname:        item['_sms_class_value@OData.Community.Display.V1.FormattedValue']   ?? '',
        subjectid:        item._sms_subject_value ?? '',
        subjectname:      item['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        termid:           item._sms_term_value   ?? '',
        termname:         item['_sms_term_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        createdon:        item.createdon   ?? '',
        modifiedon:       item.modifiedon  ?? '',
    };
}

export const getExams = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_startdate desc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}') or contains(sms_examcode,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapExam(item));
};

export const getExamById = async (id: string): Promise<Exam> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapExam(r);
};

export const createExam = async (data: CreateExamRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_examtype:  data.examtype,
        sms_startdate: data.startdate,
        sms_enddate:   data.enddate,
    };
    if (data.examcode)      payload.sms_examcode     = data.examcode;
    if (data.totalmarks     !== undefined) payload.sms_totalmarks    = data.totalmarks;
    if (data.passmarks      !== undefined) payload.sms_passmarks     = data.passmarks;
    if (data.venue          !== undefined) payload.sms_venue         = data.venue;
    if (data.weightpercent  !== undefined) payload.sms_weightpercent = data.weightpercent;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    if (data.classid)        payload['sms_class@odata.bind']        = `/sms_classes(${data.classid})`;
    if (data.subjectid)      payload['sms_subject@odata.bind']      = `/sms_subjects(${data.subjectid})`;
    if (data.termid)         payload['sms_term@odata.bind']         = `/sms_terms(${data.termid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateExam = async (id: string, data: Partial<CreateExamRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name           !== undefined) payload.sms_name          = data.name;
    if (data.examcode       !== undefined) payload.sms_examcode      = data.examcode;
    if (data.examtype       !== undefined) payload.sms_examtype      = data.examtype;
    if (data.startdate      !== undefined) payload.sms_startdate     = data.startdate;
    if (data.enddate        !== undefined) payload.sms_enddate       = data.enddate;
    if (data.totalmarks     !== undefined) payload.sms_totalmarks    = data.totalmarks;
    if (data.passmarks      !== undefined) payload.sms_passmarks     = data.passmarks;
    if (data.venue          !== undefined) payload.sms_venue         = data.venue;
    if (data.weightpercent  !== undefined) payload.sms_weightpercent = data.weightpercent;
    if (data.academicyearid !== undefined)
        payload['sms_academicyear@odata.bind'] = data.academicyearid ? `/sms_academicyears(${data.academicyearid})` : null;
    if (data.classid !== undefined)
        payload['sms_class@odata.bind']   = data.classid   ? `/sms_classes(${data.classid})`   : null;
    if (data.subjectid !== undefined)
        payload['sms_subject@odata.bind'] = data.subjectid ? `/sms_subjects(${data.subjectid})` : null;
    if (data.termid !== undefined)
        payload['sms_term@odata.bind']    = data.termid    ? `/sms_terms(${data.termid})`       : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getExamById(id);
};

export const deleteExam = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
