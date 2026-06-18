import { dataverseClient, type DvList } from "./client";
import { getExams, getExamById } from "./exams";
import { getGradingSystem } from "../grading-systems";

const TABLE = 'sms_examresults';
// Verified Dataverse fields (sms_examresult) — discovered 2026-04-22:
// sms_examresultid, sms_name
// sms_score       (Decimal — writeable)
// sms_remarks     (Memo    — writeable)
// _sms_exam_value    (Lookup → sms_exams)
// _sms_student_value (Lookup → sms_students)
// sms_percentage, sms_gradeletter, sms_gradepointvalue, sms_ispassed are Dataverse
// Calculated columns (IsValidForCreate/Update = false, always resolve to null/false) —
// they cannot be written and Dataverse never populates them. Instead, percentage/
// gradeletter/gradepointvalue/ispassed below are computed here from sms_score against
// the linked exam's sms_totalmarks/sms_passmarks using the GES grading scale.
// NOTE: sms_maxscore does NOT exist. No _sms_subject_value.

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
    examid:    string;
    studentid: string;
    score:     number;
    remarks?:  string;
}

export interface ExamResultFilters {
    examid?:    string;
    studentid?: string;
    pageSize?:  number;
}

// GES letter grade → 4.0-scale grade point, used for sms_gradepointvalue
const GES_GPA: Record<string, number> = {
    A1: 4.0, B2: 3.5, B3: 3.0, C4: 2.5, C5: 2.0, C6: 1.5, D7: 1.0, E8: 0.5, F9: 0,
};

const SELECT = [
    'sms_examresultid', 'sms_name',
    'sms_score', 'sms_remarks',
    '_sms_exam_value', '_sms_student_value',
    'createdon', 'modifiedon',
].join(',');

interface ExamTotals { totalmarks: number | null; passmarks: number | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResult(item: any, exam?: ExamTotals): ExamResult {
    const score      = item.sms_score ?? 0;
    const totalmarks = exam?.totalmarks ?? null;
    const passmarks  = exam?.passmarks  ?? null;
    const percentage = totalmarks ? Math.round((score / totalmarks) * 1000) / 10 : null;
    const gradeletter = percentage !== null ? getGradingSystem('ges').getGrade(percentage).label : '';
    return {
        examresultid:    item.sms_examresultid,
        name:            item.sms_name ?? '',
        score,
        percentage,
        gradeletter,
        gradepointvalue: gradeletter ? GES_GPA[gradeletter] ?? null : null,
        ispassed:        passmarks !== null ? score >= passmarks : false,
        remarks:         item.sms_remarks ?? '',
        examid:          item._sms_exam_value ?? '',
        examname:        item['_sms_exam_value@OData.Community.Display.V1.FormattedValue']    ?? '',
        studentid:       item._sms_student_value ?? '',
        studentname:     item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:       item.createdon ?? '',
        modifiedon:      item.modifiedon ?? '',
    };
}

export const getExamResults = async (filters?: ExamResultFilters) => {
    const pageSize = filters?.pageSize ?? 100;
    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`, `$top=${pageSize}`];
    const conditions: string[] = [];
    if (filters?.examid)    conditions.push(`_sms_exam_value eq ${filters.examid}`);
    if (filters?.studentid) conditions.push(`_sms_student_value eq ${filters.studentid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const [r, exams] = await Promise.all([
        dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`),
        getExams(),
    ]);
    const examMap = new Map(exams.map(e => [e.examid, { totalmarks: e.totalmarks, passmarks: e.passmarks }]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapResult(item, examMap.get(item._sms_exam_value)));
};

export const getExamResultById = async (id: string): Promise<ExamResult> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exam = await getExamById((r as any)._sms_exam_value);
    return mapResult(r, { totalmarks: exam.totalmarks, passmarks: exam.passmarks });
};

export const createExamResult = async (data: CreateExamResultRequest) => {
    const payload: Record<string, unknown> = {
        'sms_exam@odata.bind':    `/sms_exams(${data.examid})`,
        'sms_student@odata.bind': `/sms_students(${data.studentid})`,
        sms_score: data.score,
    };
    if (data.remarks) payload.sms_remarks = data.remarks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateExamResult = async (id: string, data: Partial<CreateExamResultRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.score   !== undefined) payload.sms_score   = data.score;
    if (data.remarks !== undefined) payload.sms_remarks = data.remarks || null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getExamResultById(id);
};

export const deleteExamResult = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
