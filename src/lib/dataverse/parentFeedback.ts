import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_parentfeedbacks';

export const FEEDBACK_TYPES: Record<number, string>  = { 1: 'Feedback', 2: 'Complaint', 3: 'Suggestion', 4: 'Question' };
export const FEEDBACK_STATUS: Record<number, string> = { 1: 'Submitted', 2: 'In Review', 3: 'Resolved' };

export interface ParentFeedback {
    feedbackid:   string;
    subject:      string;
    feedbacktype: number;
    message:      string;
    status:       number;
    response:     string;
    submittedby:  string;
    parentid:     string;
    studentid:    string;
    studentname:  string;
    createdon:    string;
}

export interface CreateFeedbackRequest {
    subject:      string;
    feedbacktype: number;
    message:      string;
    parentid:     string;
    studentid?:   string;
    submittedby?: string;
}

const SELECT = 'sms_parentfeedbackid,sms_name,sms_feedbacktype,sms_message,sms_status,sms_response,sms_submittedby,_sms_parent_value,_sms_student_value,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFeedback(item: any): ParentFeedback {
    return {
        feedbackid:   item.sms_parentfeedbackid,
        subject:      item.sms_name         ?? '',
        feedbacktype: item.sms_feedbacktype ?? 1,
        message:      item.sms_message      ?? '',
        status:       item.sms_status       ?? 1,
        response:     item.sms_response     ?? '',
        submittedby:  item.sms_submittedby  ?? '',
        parentid:     item._sms_parent_value  ?? '',
        studentid:    item._sms_student_value ?? '',
        studentname:  item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:    item.createdon ?? '',
    };
}

export const getFeedbackByParent = async (parentid: string): Promise<ParentFeedback[]> => {
    const filter = encodeURIComponent(`_sms_parent_value eq ${parentid}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=createdon desc&$top=100`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapFeedback(item));
};

export const getAllFeedback = async (): Promise<ParentFeedback[]> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=${SELECT}&$orderby=createdon desc&$top=500`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapFeedback(item));
};

export const getFeedbackById = async (id: string): Promise<ParentFeedback> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapFeedback(r as any);
};

export const updateFeedback = async (id: string, data: { status?: number; response?: string }) => {
    const payload: Record<string, unknown> = {};
    if (data.status   !== undefined) payload.sms_status   = data.status;
    if (data.response !== undefined) payload.sms_response = data.response;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getFeedbackById(id);
};

export const createFeedback = async (data: CreateFeedbackRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:         data.subject,
        sms_feedbacktype: data.feedbacktype,
        sms_message:      data.message,
        sms_status:       1,   // Submitted
        'sms_parent@odata.bind': `/sms_parents(${data.parentid})`,
    };
    if (data.studentid)   payload['sms_student@odata.bind'] = `/sms_students(${data.studentid})`;
    if (data.submittedby) payload.sms_submittedby = data.submittedby;
    return dataverseClient.post(TABLE, payload);
};
