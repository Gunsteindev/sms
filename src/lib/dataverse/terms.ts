import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_terms';
// Verified Dataverse fields (sms_terms) — table was empty during discovery 2026-04-22
// but SELECT without sms_termstatus works fine.
// NOTE: sms_termstatus does NOT exist — do not use it.
// sms_termid, sms_name, sms_startdate, sms_enddate (DateOnly → slice to 10)
// _sms_academicyear_value (Lookup → sms_academicyears)

export interface Term {
    termid:           string;
    name:             string;
    startdate:        string;
    enddate:          string;
    academicyearid:   string;
    academicyearname: string;
    createdon:        string;
    modifiedon:       string;
}

export interface CreateTermRequest {
    name:            string;
    startdate:       string;
    enddate:         string;
    academicyearid?: string;
}

const SELECT = 'sms_termid,sms_name,sms_startdate,sms_enddate,_sms_academicyear_value,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTerm(item: any): Term {
    return {
        termid:           item.sms_termid,
        name:             item.sms_name      ?? '',
        startdate:        item.sms_startdate ? item.sms_startdate.slice(0, 10) : '',
        enddate:          item.sms_enddate   ? item.sms_enddate.slice(0, 10)   : '',
        academicyearid:   item._sms_academicyear_value ?? '',
        academicyearname: item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:        item.createdon     ?? '',
        modifiedon:       item.modifiedon    ?? '',
    };
}

export const getTerms = async (search?: string, academicyearid?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_startdate asc`, `$top=${top}`];
    const conditions: string[] = [];
    if (search)         conditions.push(`contains(sms_name,'${search}')`);
    if (academicyearid) conditions.push(`_sms_academicyear_value eq ${academicyearid}`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapTerm(item));
};

export const getTermById = async (id: string): Promise<Term> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapTerm(r);
};

export const createTerm = async (data: CreateTermRequest): Promise<Term> => {
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_startdate: data.startdate,
        sms_enddate:   data.enddate,
    };
    if (data.academicyearid) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(TABLE, payload);
    return mapTerm(result);
};

export const updateTerm = async (id: string, data: Partial<CreateTermRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name           !== undefined) payload.sms_name      = data.name;
    if (data.startdate      !== undefined) payload.sms_startdate = data.startdate;
    if (data.enddate        !== undefined) payload.sms_enddate   = data.enddate;
    if (data.academicyearid !== undefined) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${data.academicyearid})`;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getTermById(id);
};

export const deleteTerm = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
