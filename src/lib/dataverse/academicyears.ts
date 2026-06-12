import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_academicyears';
// Verified Dataverse fields (sms_academicyears) — discovered 2026-04-22:
// sms_academicyearid, sms_name,
// sms_startdate, sms_enddate  (DateOnly → returns ISO datetime, slice to 10)
// sms_iscurrent   (Boolean)
// sms_yearname    (String, e.g. "Fall")
// sms_description (String)
// NOTE: sms_statuscode does NOT exist — do not use it.

export interface AcademicYear {
    academicyearid: string;
    name:           string;
    startdate:      string;
    enddate:        string;
    iscurrent:      boolean;
    yearname:       string;
    description:    string;
    createdon:      string;
    modifiedon:     string;
}

export interface CreateAcademicYearRequest {
    name:        string;
    startdate:   string;
    enddate:     string;
    iscurrent?:  boolean;
    yearname?:   string;
    description?: string;
}

const SELECT = 'sms_academicyearid,sms_name,sms_startdate,sms_enddate,sms_iscurrent,sms_yearname,sms_description,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAcademicYear(item: any): AcademicYear {
    return {
        academicyearid: item.sms_academicyearid,
        name:           item.sms_name        ?? '',
        startdate:      item.sms_startdate   ? item.sms_startdate.slice(0, 10)  : '',
        enddate:        item.sms_enddate     ? item.sms_enddate.slice(0, 10)    : '',
        iscurrent:      item.sms_iscurrent   ?? false,
        yearname:       item.sms_yearname    ?? '',
        description:    item.sms_description ?? '',
        createdon:      item.createdon       ?? '',
        modifiedon:     item.modifiedon      ?? '',
    };
}

export const getAcademicYears = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_startdate desc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapAcademicYear(item));
};

export const getAcademicYearById = async (id: string): Promise<AcademicYear> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapAcademicYear(r);
};

async function clearCurrentYears(excludeId?: string) {
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=sms_academicyearid&$filter=sms_iscurrent eq true`);
    const others: string[] = (r.value ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((y: any) => y.sms_academicyearid as string)
        .filter((yid: string) => yid !== excludeId);
    await Promise.all(others.map(yid => dataverseClient.patch(`${TABLE}(${yid})`, { sms_iscurrent: false })));
}

export const createAcademicYear = async (data: CreateAcademicYearRequest) => {
    if (data.iscurrent) await clearCurrentYears();
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_startdate: data.startdate,
        sms_enddate:   data.enddate,
    };
    if (data.iscurrent   !== undefined) payload.sms_iscurrent   = data.iscurrent;
    if (data.yearname    !== undefined) payload.sms_yearname    = data.yearname;
    if (data.description !== undefined) payload.sms_description = data.description;
    return dataverseClient.post(TABLE, payload);
};

export const updateAcademicYear = async (id: string, data: Partial<CreateAcademicYearRequest>) => {
    if (data.iscurrent) await clearCurrentYears(id);
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.startdate   !== undefined) payload.sms_startdate   = data.startdate;
    if (data.enddate     !== undefined) payload.sms_enddate     = data.enddate;
    if (data.iscurrent   !== undefined) payload.sms_iscurrent   = data.iscurrent;
    if (data.yearname    !== undefined) payload.sms_yearname    = data.yearname;
    if (data.description !== undefined) payload.sms_description = data.description;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getAcademicYearById(id);
};

export const deleteAcademicYear = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
