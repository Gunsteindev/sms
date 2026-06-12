import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_expenditures';

// Category: 1=Supplies, 2=Equipment, 3=Services, 4=Maintenance, 5=Utilities, 6=Other
// Status:   1=Pending, 2=Approved, 3=Paid, 4=Rejected

export interface Expenditure {
    expenditureid:  string;
    name:           string;
    amount:         number;
    category:       number;
    expendituredate: string;
    supplier:       string;
    approvedby:     string;
    status:         number;
    reference:      string;
    notes:          string;
    createdon:      string;
    modifiedon:     string;
}

export interface CreateExpenditureRequest {
    name:             string;
    amount:           number;
    category?:        number;
    expendituredate:  string;
    supplier?:        string;
    approvedby?:      string;
    status?:          number;
    reference?:       string;
    notes?:           string;
}

const SELECT = 'sms_expenditureid,sms_name,sms_amount,sms_category,sms_expendituredate,sms_supplier,sms_approvedby,sms_status,sms_reference,sms_notes,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpenditure(item: any): Expenditure {
    return {
        expenditureid:   item.sms_expenditureid,
        name:            item.sms_name            ?? '',
        amount:          item.sms_amount          ?? 0,
        category:        item.sms_category        ?? 6,
        expendituredate: item.sms_expendituredate ?? '',
        supplier:        item.sms_supplier        ?? '',
        approvedby:      item.sms_approvedby      ?? '',
        status:          item.sms_status          ?? 1,
        reference:       item.sms_reference       ?? '',
        notes:           item.sms_notes           ?? '',
        createdon:       item.createdon           ?? '',
        modifiedon:      item.modifiedon          ?? '',
    };
}

export const getExpenditures = async (category?: number, status?: number) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_expendituredate desc`];
    const conditions: string[] = [];
    if (category) conditions.push(`sms_category eq ${category}`);
    if (status)   conditions.push(`sms_status eq ${status}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapExpenditure);
};

export const getExpenditureById = async (id: string): Promise<Expenditure> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapExpenditure(r);
};

export const createExpenditure = async (data: CreateExpenditureRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:            data.name,
        sms_amount:          data.amount,
        sms_expendituredate: data.expendituredate,
    };
    if (data.category   !== undefined) payload.sms_category   = data.category;
    if (data.supplier   !== undefined) payload.sms_supplier   = data.supplier;
    if (data.approvedby !== undefined) payload.sms_approvedby = data.approvedby;
    if (data.status     !== undefined) payload.sms_status     = data.status;
    if (data.reference  !== undefined) payload.sms_reference  = data.reference;
    if (data.notes      !== undefined) payload.sms_notes      = data.notes;
    return dataverseClient.post(TABLE, payload);
};

export const updateExpenditure = async (id: string, data: Partial<CreateExpenditureRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name            !== undefined) payload.sms_name            = data.name;
    if (data.amount          !== undefined) payload.sms_amount          = data.amount;
    if (data.category        !== undefined) payload.sms_category        = data.category;
    if (data.expendituredate !== undefined) payload.sms_expendituredate = data.expendituredate;
    if (data.supplier        !== undefined) payload.sms_supplier        = data.supplier;
    if (data.approvedby      !== undefined) payload.sms_approvedby      = data.approvedby;
    if (data.status          !== undefined) payload.sms_status          = data.status;
    if (data.reference       !== undefined) payload.sms_reference       = data.reference;
    if (data.notes           !== undefined) payload.sms_notes           = data.notes;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getExpenditureById(id);
};

export const deleteExpenditure = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
