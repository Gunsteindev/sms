import { dataverseClient } from "./client";

const TABLE = 'sms_examresults';
// Verified Dataverse fields (sms_examresult) — discovered 2026-04-22:
// sms_examresultid, sms_name
// sms_score       (Decimal — writeable)
// sms_percentage  (Decimal — server-calculated from score/totalmarks)
// sms_gradeletter (String  — writeable grade letter, e.g. "A", "B+")
// sms_gradepointvalue (Decimal — server-calculated GPA point)
// sms_ispassed    (Boolean — server-calculated)
// sms_remarks     (Memo    — writeable)
// _sms_exam_value    (Lookup → sms_exams)
// _sms_student_value (Lookup → sms_students)
// NOTE: sms_maxscore does NOT exist. sms_grade → sms_gradeletter. No _sms_subject_value.

export interface ExamResult {
    examresultid:    string;
    name:            string;
    score:           number;
    percentage:      number | null;
    gradeletter:     string;
    gradepointvalue: number | null;
    ispassed:        boolean;
    remarks:         string;
    examid:          string;
    examname:        string;
    studentid:       string;
    studentname:     string;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateExamResultRequest {
    examid:      string;
    studentid:   string;
    score:       number;
    gradeletter?: string;
    remarks?:    string;
}

export interface ExamResultFilters {
    examid?:    string;
    studentid?: string;
    pageSize?:  number;
}

const SELECT = [
    'sms_examresultid', 'sms_name',
    'sms_score', 'sms_percentage', 'sms_gradeletter', 'sms_gradepointvalue', 'sms_ispassed',
    'sms_remarks',
    '_sms_exam_value', '_sms_student_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResult(item: any): ExamResult {
    return {
        examresultid:    item.sms_examresultid,
        name:            item.sms_name          ?? '',
        score:           item.sms_score         ?? 0,
        percentage:      item.sms_percentage    ?? null,
        gradeletter:     item.sms_gradeletter   ?? '',
        gradepointvalue: item.sms_gradepointvalue ?? null,
        ispassed:        item.sms_ispassed       ?? false,
        remarks:         item.sms_remarks        ?? '',
        examid:          item._sms_exam_value    ?? '',
        examname:        item['_sms_exam_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        studentid:       item._sms_student_value ?? '',
        studentname:     item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:       item.createdon          ?? '',
        modifiedon:      item.modifiedon         ?? '',
    };
}

export const getExamResults = async (filters?: ExamResultFilters) => {
    const pageSize = filters?.pageSize ?? 100;
    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`, `$top=${pageSize}`];
    const conditions: string[] = [];
    if (filters?.examid)    conditions.push(`_sms_exam_value eq ${filters.examid}`);
    if (filters?.studentid) conditions.push(`_sms_student_value eq ${filters.studentid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapResult(item));
};

export const getExamResultById = async (id: string): Promise<ExamResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapResult(r);
};

export const createExamResult = async (data: CreateExamResultRequest) => {
    const payload: Record<string, unknown> = {
        'sms_exam@odata.bind':    `/sms_exams(${data.examid})`,
        'sms_student@odata.bind': `/sms_students(${data.studentid})`,
        sms_score: data.score,
    };
    if (data.gradeletter) payload.sms_gradeletter = data.gradeletter;
    if (data.remarks)     payload.sms_remarks     = data.remarks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateExamResult = async (id: string, data: Partial<CreateExamResultRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.score       !== undefined) payload.sms_score       = data.score;
    if (data.gradeletter !== undefined) payload.sms_gradeletter = data.gradeletter;
    if (data.remarks     !== undefined) payload.sms_remarks     = data.remarks || null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getExamResultById(id);
};

export const deleteExamResult = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
