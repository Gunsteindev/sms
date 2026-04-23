import { dataverseClient } from "./client";

// Actual Dataverse fields:
// sms_feestructure: sms_feestructureid, sms_name, sms_feetype, sms_amount, sms_duedate,
//   sms_gradelevel, sms_academicyear (lookup), sms_academicyearname
// sms_feepayment: sms_feepaymentid, sms_name, sms_amount, sms_paymentdate,
//   sms_paymentmethod, sms_paymentstatus, sms_receiptnumber, sms_transactionid,
//   sms_student (lookup), sms_studentname, sms_feestructure (lookup), sms_feestructurename

export interface FeeStructure {
    feestructureid: string;
    name: string;
    feetype: number;
    amount: number;
    duedate: string;
    gradelevel: number;
    academicyearid: string;
    academicyearname: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateFeeStructureRequest {
    name: string;
    feetype: number;
    amount: number;
    duedate?: string;
    gradelevel?: number;
    academicyearid?: string;
}

export interface FeePayment {
    feepaymentid: string;
    studentname: string;
    feestructurename: string;
    amount: number;
    paymentdate: string;
    paymentmethod: number;
    paymentstatus: number;
    transactionid: string;
    receiptnumber: string;
    createdon: string;
}

export interface CreateFeePaymentRequest {
    studentid: string;
    feestructureid: string;
    amount: number;
    paymentdate: string;
    paymentmethod: number;
    paymentstatus?: number;
    transactionid?: string;
    receiptnumber?: string;
}

export interface FeePaymentFilters {
    studentid?: string;
    status?: number;
    page?: number;
    pageSize?: number;
}

const FEE_STRUCTURE_TABLE = 'sms_feestructures';
const FEE_PAYMENT_TABLE   = 'sms_feepayments';

export const FEE_TYPES: Record<number, string> = {
    1: 'Tuition', 2: 'Books', 3: 'Uniform',
    4: 'Transport', 5: 'Exam', 6: 'Activity', 7: 'Other',
};

const FS_SELECT = 'sms_feestructureid,sms_name,sms_feetype,sms_amount,sms_duedate,sms_gradelevel,_sms_academicyear_value,createdon,modifiedon';
const FP_SELECT = 'sms_feepaymentid,sms_amount,sms_paymentdate,sms_paymentmethod,sms_paymentstatus,sms_receiptnumber,sms_transactionid,_sms_student_value,_sms_feestructure_value,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFeeStructure(item: any): FeeStructure {
    return {
        feestructureid:   item.sms_feestructureid,
        name:             item.sms_name            ?? '',
        feetype:          item.sms_feetype         ?? 0,
        amount:           item.sms_amount          ?? 0,
        duedate:          item.sms_duedate         ?? '',
        gradelevel:       item.sms_gradelevel      ?? 0,
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon           ?? '',
        modifiedon:       item.modifiedon          ?? '',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFeePayment(item: any): FeePayment {
    return {
        feepaymentid:     item.sms_feepaymentid,
        studentname:      item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        feestructurename: item['_sms_feestructure_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        amount:           item.sms_amount          ?? 0,
        paymentdate:      item.sms_paymentdate     ?? '',
        paymentmethod:    item.sms_paymentmethod   ?? 1,
        paymentstatus:    item.sms_paymentstatus   ?? 1,
        transactionid:    item.sms_transactionid   ?? '',
        receiptnumber:    item.sms_receiptnumber   ?? '',
        createdon:        item.createdon           ?? '',
    };
}

export const createFeeStructure = async (data: CreateFeeStructureRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:    data.name,
        sms_feetype: data.feetype,
        sms_amount:  data.amount,
    };
    if (data.duedate)      payload.sms_duedate    = data.duedate;
    if (data.gradelevel)   payload.sms_gradelevel = data.gradelevel;
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(FEE_STRUCTURE_TABLE, payload);
};

export const updateFeeStructure = async (id: string, data: Partial<CreateFeeStructureRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name          !== undefined) payload.sms_name       = data.name;
    if (data.feetype       !== undefined) payload.sms_feetype    = data.feetype;
    if (data.amount        !== undefined) payload.sms_amount     = data.amount;
    if (data.duedate       !== undefined) payload.sms_duedate    = data.duedate;
    if (data.gradelevel    !== undefined) payload.sms_gradelevel = data.gradelevel;
    if (data.academicyearid !== undefined) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    await dataverseClient.patch(`${FEE_STRUCTURE_TABLE}(${id})`, payload);
    return getFeeStructureById(id);
};

export const deleteFeeStructure = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${FEE_STRUCTURE_TABLE}(${id})`);
};

export const getFeeStructures = async (gradelevel?: number) => {
    const conditions: string[] = [];
    if (gradelevel) conditions.push(`sms_gradelevel eq ${gradelevel}`);
    const filter = conditions.length ? `&$filter=${encodeURIComponent(conditions.join(' and '))}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${FEE_STRUCTURE_TABLE}?$select=${FS_SELECT}${filter}&$orderby=sms_feetype asc`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapFeeStructure(item));
};

export const getFeeStructureById = async (id: string): Promise<FeeStructure> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${FEE_STRUCTURE_TABLE}(${id})?$select=${FS_SELECT}`);
    return mapFeeStructure(r);
};

export const getFeePayments = async (filters?: FeePaymentFilters) => {
    const parts: string[] = [`$select=${FP_SELECT}`, `$orderby=sms_paymentdate desc`];
    const pageSize = filters?.pageSize ?? 50;
    parts.push(`$top=${pageSize}`);

    const conditions: string[] = [];
    if (filters?.studentid) conditions.push(`_sms_student_value eq ${filters.studentid}`);
    if (filters?.status !== undefined) conditions.push(`sms_paymentstatus eq ${filters.status}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${FEE_PAYMENT_TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (r.value ?? []).map((item: any) => mapFeePayment(item));
    return {
        items,
        totalCount: r['@odata.count'] ?? items.length,
        hasNextPage: !!r['@odata.nextLink'],
        nextLink: r['@odata.nextLink'] ?? null,
    };
};

export const createFeePayment = async (data: CreateFeePaymentRequest) => {
    const payload: Record<string, unknown> = {
        'sms_student@odata.bind':      `/sms_students(${data.studentid})`,
        'sms_feestructure@odata.bind': `/sms_feestructures(${data.feestructureid})`,
        sms_amount:        data.amount,
        sms_paymentdate:   data.paymentdate,
        sms_paymentmethod: data.paymentmethod,
    };
    if (data.transactionid) payload.sms_transactionid = data.transactionid;
    if (data.receiptnumber) payload.sms_receiptnumber  = data.receiptnumber;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(FEE_PAYMENT_TABLE, payload);
};

export const updateFeePayment = async (id: string, data: Partial<CreateFeePaymentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.amount        !== undefined) payload.sms_amount        = data.amount;
    if (data.paymentdate   !== undefined) payload.sms_paymentdate   = data.paymentdate;
    if (data.paymentmethod !== undefined) payload.sms_paymentmethod = data.paymentmethod;
    if (data.paymentstatus !== undefined) payload.sms_paymentstatus = data.paymentstatus;
    if (data.transactionid !== undefined) payload.sms_transactionid = data.transactionid;
    if (data.receiptnumber !== undefined) payload.sms_receiptnumber = data.receiptnumber;
    await dataverseClient.patch(`${FEE_PAYMENT_TABLE}(${id})`, payload);
};

export const deleteFeePayment = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${FEE_PAYMENT_TABLE}(${id})`);
};

export const getFeeSummaryForStudent = async (studentid: string) => {
    const filter = encodeURIComponent(`_sms_student_value eq ${studentid}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${FEE_PAYMENT_TABLE}?$select=sms_amount,sms_paymentstatus&$filter=${filter}`);
    const payments = r.value ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPaid = payments.filter((p: any) => p.sms_paymentstatus === 1).reduce((s: number, p: any) => s + (p.sms_amount || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPending = payments.filter((p: any) => p.sms_paymentstatus !== 1).reduce((s: number, p: any) => s + (p.sms_amount || 0), 0);
    return { totalPaid, totalPending, count: payments.length };
};

export const getCurrentMonthRevenue = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    const filter = encodeURIComponent(`sms_paymentdate ge ${startDate} and sms_paymentdate le ${endDate} and sms_paymentstatus eq 1`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${FEE_PAYMENT_TABLE}?$select=sms_amount&$filter=${filter}`);
    const payments = r.value ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRevenue = payments.reduce((s: number, p: any) => s + (p.sms_amount || 0), 0);
    return { totalRevenue, totalPayments: payments.length, month: now.getMonth() + 1, year };
};
