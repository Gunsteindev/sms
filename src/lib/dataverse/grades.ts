import { dataverseClient } from "./client";

const TABLE = 'sms_grades';

export type AssessmentType = 1 | 2 | 3 | 4 | 5 | 6;
// 1=Classwork, 2=Homework, 3=Quiz, 4=MidTerm, 5=EndOfTerm, 6=Project

export interface Grade {
    gradeid: string;
    name: string;
    assessmenttype: AssessmentType;
    assessmenttypename: string;
    score: number;
    maxscore: number;
    date: string;
    remarks: string;
    studentid: string;
    studentname: string;
    subjectid: string;
    subjectname: string;
    classid: string;
    classname: string;
    termid: string;
    termname: string;
    academicyearid: string;
    academicyearname: string;
    teacherid: string;
    teachername: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateGradeRequest {
    assessmenttype: AssessmentType;
    score: number;
    maxscore?: number;
    date?: string;
    remarks?: string;
    studentid: string;
    subjectid: string;
    classid: string;
    termid?: string;
    academicyearid?: string;
    teacherid?: string;
}

export interface GradeFilters {
    classid?: string;
    subjectid?: string;
    termid?: string;
    academicyearid?: string;
    studentid?: string;
    assessmenttype?: AssessmentType;
}

const ASSESSMENT_NAMES: Record<number, string> = {
    1: 'Classwork',
    2: 'Homework',
    3: 'Quiz',
    4: 'MidTerm',
    5: 'End of Term',
    6: 'Project',
};

const SELECT = [
    'sms_gradeid', 'sms_name', 'sms_assessmenttype', 'sms_score', 'sms_maxscore',
    'sms_date', 'sms_remarks',
    '_sms_student_value', '_sms_subject_value', '_sms_class_value',
    '_sms_term_value', '_sms_academicyear_value', '_sms_teacher_value',
    'createdon', 'modifiedon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGrade(item: any): Grade {
    const atype = item.sms_assessmenttype ?? 1;
    return {
        gradeid:          item.sms_gradeid,
        name:             item.sms_name ?? '',
        assessmenttype:   atype as AssessmentType,
        assessmenttypename: ASSESSMENT_NAMES[atype] ?? '',
        score:            item.sms_score ?? 0,
        maxscore:         item.sms_maxscore ?? 100,
        date:             item.sms_date ? item.sms_date.slice(0, 10) : '',
        remarks:          item.sms_remarks ?? '',
        studentid:        item._sms_student_value ?? '',
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        subjectid:        item._sms_subject_value ?? '',
        subjectname:      item['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        classid:          item._sms_class_value ?? '',
        classname:        item['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        termid:           item._sms_term_value ?? '',
        termname:         item['_sms_term_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        teacherid:        item._sms_teacher_value ?? '',
        teachername:      item['_sms_teacher_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon ?? '',
        modifiedon:       item.modifiedon ?? '',
    };
}

export const getGrades = async (filters?: GradeFilters) => {
    const conditions: string[] = [];
    if (filters?.classid)        conditions.push(`_sms_class_value eq ${filters.classid}`);
    if (filters?.subjectid)      conditions.push(`_sms_subject_value eq ${filters.subjectid}`);
    if (filters?.termid)         conditions.push(`_sms_term_value eq ${filters.termid}`);
    if (filters?.academicyearid) conditions.push(`_sms_academicyear_value eq ${filters.academicyearid}`);
    if (filters?.studentid)      conditions.push(`_sms_student_value eq ${filters.studentid}`);
    if (filters?.assessmenttype) conditions.push(`sms_assessmenttype eq ${filters.assessmenttype}`);

    const parts: string[] = [
        `$select=${SELECT}`,
        `$orderby=sms_assessmenttype asc,sms_date asc`,
        `$top=1000`,
        `$count=true`,
    ];
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (response.value ?? []).map((r: any) => mapGrade(r));
    return {
        items,
        totalCount: (response['@odata.count'] as number) ?? items.length,
    };
};

export const getGradeById = async (id: string): Promise<Grade> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapGrade(r);
};

export const createGrade = async (data: CreateGradeRequest) => {
    const subjectName = data.subjectid ? 'Subject' : 'N/A';
    const payload: Record<string, unknown> = {
        sms_name:           `${subjectName} - ${ASSESSMENT_NAMES[data.assessmenttype]} `,
        sms_assessmenttype: data.assessmenttype,
        sms_score:          data.score,
        sms_maxscore:       data.maxscore ?? 100,
    };
    if (data.date)           payload.sms_date     = data.date;
    if (data.remarks)        payload.sms_remarks  = data.remarks;
    if (data.studentid)      payload['sms_student@odata.bind']      = `/sms_students(${data.studentid})`;
    if (data.subjectid)      payload['sms_subject@odata.bind']      = `/sms_subjects(${data.subjectid})`;
    if (data.classid)        payload['sms_class@odata.bind']        = `/sms_classes(${data.classid})`;
    if (data.termid)         payload['sms_term@odata.bind']         = `/sms_terms(${data.termid})`;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    if (data.teacherid)      payload['sms_teacher@odata.bind']      = `/sms_teachers(${data.teacherid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updateGrade = async (id: string, data: Partial<CreateGradeRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.assessmenttype !== undefined) payload.sms_assessmenttype = data.assessmenttype;
    if (data.score          !== undefined) payload.sms_score          = data.score;
    if (data.maxscore       !== undefined) payload.sms_maxscore       = data.maxscore;
    if (data.date           !== undefined) payload.sms_date           = data.date;
    if (data.remarks        !== undefined) payload.sms_remarks        = data.remarks;
    if (data.studentid      !== undefined)
        payload['sms_student@odata.bind']      = data.studentid      ? `/sms_students(${data.studentid})` : null;
    if (data.subjectid      !== undefined)
        payload['sms_subject@odata.bind']      = data.subjectid      ? `/sms_subjects(${data.subjectid})` : null;
    if (data.classid        !== undefined)
        payload['sms_class@odata.bind']        = data.classid        ? `/sms_classes(${data.classid})` : null;
    if (data.termid         !== undefined)
        payload['sms_term@odata.bind']         = data.termid         ? `/sms_terms(${data.termid})` : null;
    if (data.academicyearid !== undefined)
        payload['sms_academicyear@odata.bind'] = data.academicyearid ? `/sms_academicyears(${data.academicyearid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getGradeById(id);
};

export const deleteGrade = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export interface BulkGradeEntry {
    gradeid?: string;
    studentid: string;
    subjectid: string;
    classid: string;
    termid?: string;
    academicyearid?: string;
    assessmenttype: AssessmentType;
    score: number;
    maxscore?: number;
    date?: string;
    remarks?: string;
}

export const bulkUpsertGrades = async (entries: BulkGradeEntry[]) => {
    const results = await Promise.allSettled(
        entries.map(e => {
            if (e.gradeid) {
                return updateGrade(e.gradeid, e);
            }
            return createGrade(e);
        })
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    return { saved: results.length - failed, failed };
};
