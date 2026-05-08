import { dataverseClient } from "./client";

// sms_school:       sms_schoolid, sms_name, sms_motto, sms_type (choice), sms_level (choice),
//                   sms_address, sms_phone, sms_email, sms_currency, sms_website,
//                   sms_emiscode, sms_district, sms_region, sms_logo (multiline text, base64)
// sms_schoolbranch: sms_schoolbranchid, sms_name, sms_school (lookup → sms_school),
//                   sms_address, sms_district, sms_region, sms_phone, sms_email, sms_ismain

export type SchoolType  = 'ges' | 'cambridge' | 'ib' | 'american' | 'french' | 'mixed';
export type SchoolLevel = 'primary' | 'jhs' | 'shs' | 'international' | 'all';

export interface SchoolProfile {
    schoolid:     string;
    name:         string;
    motto:        string;
    type:         SchoolType;
    level:        SchoolLevel;
    address:      string;
    phone:        string;
    email:        string;
    currency:     string;
    website:      string;
    emiscode:     string;
    district:     string;
    region:       string;
    logo:         string;   // base64 data URL, stored in sms_logo (multiline text)
    primarycolor: string;   // hex, e.g. #2563eb
    sidebarcolor: string;   // hex, e.g. #0f172a
}

export interface SchoolBranch {
    branchid:  string;
    schoolid:  string;
    name:      string;
    address:   string;
    district:  string;
    region:    string;
    phone:     string;
    email:     string;
    ismain:    boolean;
}

export interface UpsertSchoolRequest {
    name:          string;
    motto?:        string;
    type?:         SchoolType;
    level?:        SchoolLevel;
    address?:      string;
    phone?:        string;
    email?:        string;
    currency?:     string;
    website?:      string;
    emiscode?:     string;
    district?:     string;
    region?:       string;
    logo?:         string;
    primarycolor?: string;
    sidebarcolor?: string;
}

export interface CreateBranchRequest {
    schoolid:  string;
    name:      string;
    address?:  string;
    district?: string;
    region?:   string;
    phone?:    string;
    email?:    string;
    ismain?:   boolean;
}

export interface UpdateBranchRequest {
    name?:     string;
    address?:  string;
    district?: string;
    region?:   string;
    phone?:    string;
    email?:    string;
    ismain?:   boolean;
}

/* ── Picklist mappings ─────────────────────────────────────────────────── */

const TYPE_MAP: Record<number, SchoolType>  = { 1: 'ges', 2: 'cambridge', 3: 'ib', 4: 'american', 5: 'french', 6: 'mixed' };
const TYPE_REV: Record<SchoolType, number>  = { ges: 1, cambridge: 2, ib: 3, american: 4, french: 5, mixed: 6 };
const LVL_MAP:  Record<number, SchoolLevel> = { 1: 'primary', 2: 'jhs', 3: 'shs', 4: 'international', 5: 'all' };
const LVL_REV:  Record<SchoolLevel, number> = { primary: 1, jhs: 2, shs: 3, international: 4, all: 5 };

/* ── Table / field constants ────────────────────────────────────────────── */

const SCHOOL_TABLE = 'sms_schools';
const BRANCH_TABLE = 'sms_schoolbranchs';

const SCHOOL_SELECT = 'sms_schoolid,sms_name,sms_motto,sms_type,sms_level,sms_address,sms_phone,sms_email,sms_currency,sms_website,sms_emiscode,sms_district,sms_region,sms_logo';
const BRANCH_SELECT = 'sms_schoolbranchid,sms_name,sms_address,sms_district,sms_region,sms_phone,sms_email,sms_ismain,_sms_school_value';

/* ── Mappers ────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSchool(item: any): SchoolProfile {
    return {
        schoolid: item.sms_schoolid,
        name:     item.sms_name     ?? '',
        motto:    item.sms_motto    ?? '',
        type:     TYPE_MAP[item.sms_type]  ?? 'ges',
        level:    LVL_MAP[item.sms_level] ?? 'all',
        address:  item.sms_address  ?? '',
        phone:    item.sms_phone    ?? '',
        email:    item.sms_email    ?? '',
        currency: item.sms_currency ?? 'GHS',
        website:  item.sms_website  ?? '',
        emiscode: item.sms_emiscode ?? '',
        district: item.sms_district ?? '',
        region:   item.sms_region   ?? '',
        logo:         item.sms_logo ?? '',
        primarycolor: '',
        sidebarcolor: '',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBranch(item: any): SchoolBranch {
    return {
        branchid: item.sms_schoolbranchid,
        schoolid: item._sms_school_value ?? '',
        name:     item.sms_name          ?? '',
        address:  item.sms_address       ?? '',
        district: item.sms_district      ?? '',
        region:   item.sms_region        ?? '',
        phone:    item.sms_phone         ?? '',
        email:    item.sms_email         ?? '',
        ismain:   item.sms_ismain        ?? false,
    };
}

function buildSchoolPayload(data: Partial<UpsertSchoolRequest>): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    if (data.name     !== undefined) p.sms_name     = data.name;
    if (data.motto    !== undefined) p.sms_motto    = data.motto;
    if (data.type     !== undefined) p.sms_type     = TYPE_REV[data.type];
    if (data.level    !== undefined) p.sms_level    = LVL_REV[data.level];
    if (data.address  !== undefined) p.sms_address  = data.address;
    if (data.phone    !== undefined) p.sms_phone    = data.phone;
    if (data.email    !== undefined) p.sms_email    = data.email;
    if (data.currency !== undefined) p.sms_currency = data.currency;
    if (data.website  !== undefined) p.sms_website  = data.website;
    if (data.emiscode !== undefined) p.sms_emiscode = data.emiscode;
    if (data.district !== undefined) p.sms_district = data.district;
    if (data.region   !== undefined) p.sms_region   = data.region;
    if (data.logo !== undefined) p.sms_logo = data.logo;
    return p;
}

/* ── School profile ─────────────────────────────────────────────────────── */

export const getSchoolProfile = async (): Promise<SchoolProfile | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${SCHOOL_TABLE}?$select=${SCHOOL_SELECT}&$top=1`);
    const items = r.value ?? [];
    return items.length > 0 ? mapSchool(items[0]) : null;
};

export const getSchoolById = async (id: string): Promise<SchoolProfile | null> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await dataverseClient.get<any>(`${SCHOOL_TABLE}(${id})?$select=${SCHOOL_SELECT}`);
        return mapSchool(r);
    } catch { return null; }
};

export const getAllSchools = async (): Promise<SchoolProfile[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${SCHOOL_TABLE}?$select=${SCHOOL_SELECT}&$orderby=sms_name asc`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapSchool(item));
};

export const createSchool = async (data: UpsertSchoolRequest): Promise<SchoolProfile> => {
    const payload = buildSchoolPayload(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(SCHOOL_TABLE, payload);
    return mapSchool(result);
};

export const updateSchool = async (id: string, data: Partial<UpsertSchoolRequest>): Promise<SchoolProfile> => {
    await dataverseClient.patch(`${SCHOOL_TABLE}(${id})`, buildSchoolPayload(data));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${SCHOOL_TABLE}(${id})?$select=${SCHOOL_SELECT}`);
    return mapSchool(r);
};

/* ── Branches ───────────────────────────────────────────────────────────── */

export const getBranches = async (schoolid?: string): Promise<SchoolBranch[]> => {
    const filter = schoolid ? `&$filter=_sms_school_value eq ${schoolid}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${BRANCH_TABLE}?$select=${BRANCH_SELECT}&$orderby=sms_name asc${filter}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapBranch(item));
};

export const getBranchById = async (id: string): Promise<SchoolBranch> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${BRANCH_TABLE}(${id})?$select=${BRANCH_SELECT}`);
    return mapBranch(r);
};

export const createBranch = async (data: CreateBranchRequest): Promise<SchoolBranch> => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.schoolid) payload['sms_school@odata.bind'] = `/sms_schools(${data.schoolid})`;
    if (data.address  !== undefined) payload.sms_address  = data.address;
    if (data.district !== undefined) payload.sms_district = data.district;
    if (data.region   !== undefined) payload.sms_region   = data.region;
    if (data.phone    !== undefined) payload.sms_phone    = data.phone;
    if (data.email    !== undefined) payload.sms_email    = data.email;
    if (data.ismain   !== undefined) payload.sms_ismain   = data.ismain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(BRANCH_TABLE, payload);
    return mapBranch(result);
};

export const updateBranch = async (id: string, data: UpdateBranchRequest): Promise<SchoolBranch> => {
    const payload: Record<string, unknown> = {};
    if (data.name     !== undefined) payload.sms_name     = data.name;
    if (data.address  !== undefined) payload.sms_address  = data.address;
    if (data.district !== undefined) payload.sms_district = data.district;
    if (data.region   !== undefined) payload.sms_region   = data.region;
    if (data.phone    !== undefined) payload.sms_phone    = data.phone;
    if (data.email    !== undefined) payload.sms_email    = data.email;
    if (data.ismain   !== undefined) payload.sms_ismain   = data.ismain;
    await dataverseClient.patch(`${BRANCH_TABLE}(${id})`, payload);
    return getBranchById(id);
};

export const deleteBranch = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${BRANCH_TABLE}(${id})`);
};

// Marks one branch as main campus and clears ismain on all sibling branches
export const setMainBranch = async (branchId: string): Promise<SchoolBranch> => {
    const branch = await getBranchById(branchId);
    if (branch.schoolid) {
        const siblings = await getBranches(branch.schoolid);
        await Promise.all(
            siblings
                .filter(b => b.ismain && b.branchid !== branchId)
                .map(b => dataverseClient.patch(`${BRANCH_TABLE}(${b.branchid})`, { sms_ismain: false }))
        );
    }
    await dataverseClient.patch(`${BRANCH_TABLE}(${branchId})`, { sms_ismain: true });
    return getBranchById(branchId);
};
