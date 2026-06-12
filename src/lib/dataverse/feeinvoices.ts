import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_fees';
// Fields: sms_feeid, sms_name, sms_amount, sms_duedate,
//         sms_feestatus (1=Pending, 2=Paid, 3=Overdue, 4=Waived)
// Lookups: sms_student → _sms_student_value
//          sms_feestructure → _sms_feestructure_value
//          sms_academicyear → _sms_academicyear_value
//          sms_term → _sms_term_value

export interface FeeInvoice {
    feeid: string;
    name: string;
    amount: number;
    duedate: string;
    feestatus: number;
    studentid: string;
    studentname: string;
    feestructureid: string;
    feestructurename: string;
    academicyearid: string;
    academicyearname: string;
    termid: string;
    termname: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateFeeInvoiceRequest {
    studentid: string;
    feestructureid: string;
    amount: number;
    duedate?: string;
    feestatus?: number;
    academicyearid?: string;
    termid?: string;
}

export interface FeeInvoiceFilters {
    studentid?: string;
    status?: number;
    academicyearid?: string;
    termid?: string;
    page?: number;
    pageSize?: number;
}

export const FEE_INVOICE_STATUS: Record<number, string> = {
    1: 'Pending',
    2: 'Paid',
    3: 'Overdue',
    4: 'Waived',
};

const SELECT = 'sms_feeid,sms_name,sms_amount,sms_duedate,sms_feestatus,_sms_student_value,_sms_feestructure_value,_sms_academicyear_value,_sms_term_value,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(item: any): FeeInvoice {
    return {
        feeid:            item.sms_feeid,
        name:             item.sms_name       ?? '',
        amount:           item.sms_amount     ?? 0,
        duedate:          item.sms_duedate    ?? '',
        feestatus:        item.sms_feestatus  ?? 1,
        studentid:        item._sms_student_value ?? '',
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        feestructureid:   item._sms_feestructure_value ?? '',
        feestructurename: item['_sms_feestructure_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        termid:           item._sms_term_value ?? '',
        termname:         item['_sms_term_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon  ?? '',
        modifiedon:       item.modifiedon ?? '',
    };
}

export const getFeeInvoices = async (filters?: FeeInvoiceFilters) => {
    const pageSize = filters?.pageSize ?? 50;
    const parts = [`$select=${SELECT}`, `$orderby=sms_duedate desc`, `$top=${pageSize}`];
    const conditions: string[] = [];
    if (filters?.studentid)     conditions.push(`_sms_student_value eq ${filters.studentid}`);
    if (filters?.status !== undefined) conditions.push(`sms_feestatus eq ${filters.status}`);
    if (filters?.academicyearid) conditions.push(`_sms_academicyear_value eq ${filters.academicyearid}`);
    if (filters?.termid)         conditions.push(`_sms_term_value eq ${filters.termid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapInvoice(item));
};

export const getFeeInvoiceById = async (id: string): Promise<FeeInvoice> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapInvoice(r);
};

export const createFeeInvoice = async (data: CreateFeeInvoiceRequest) => {
    const payload: Record<string, unknown> = {
        'sms_student@odata.bind':      `/sms_students(${data.studentid})`,
        'sms_feestructure@odata.bind': `/sms_feestructures(${data.feestructureid})`,
        sms_amount:    data.amount,
        sms_feestatus: data.feestatus ?? 1,
    };
    if (data.duedate)       payload.sms_duedate = data.duedate;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    if (data.termid)         payload['sms_term@odata.bind']         = `/sms_terms(${data.termid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateFeeInvoice = async (id: string, data: Partial<CreateFeeInvoiceRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.amount    !== undefined) payload.sms_amount    = data.amount;
    if (data.duedate   !== undefined) payload.sms_duedate   = data.duedate;
    if (data.feestatus !== undefined) payload.sms_feestatus = data.feestatus;
    if (data.academicyearid !== undefined) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    if (data.termid         !== undefined) payload['sms_term@odata.bind']         = `/sms_terms(${data.termid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getFeeInvoiceById(id);
};

export const deleteFeeInvoice = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
