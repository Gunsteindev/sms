import { dataverseClient } from './client';

// Dataverse table: sms_feetypes
// Fields:
//   sms_feetypeid   (PrimaryKey, GUID)
//   sms_name        (String)        — display name
//   sms_description (String)        — optional description
//   sms_category    (Picklist int)  — 1=Academic 2=Residential 3=Extracurricular 4=Administrative
//   sms_mandatory   (TwoOptions)    — true/false
//   sms_color       (String)        — UI colour token (e.g. "blue")
//   statecode / statuscode / createdon / modifiedon (standard)

const TABLE = 'sms_feetypes';

export const CATEGORY_VALUES = {
    academic:        1,
    residential:     2,
    extracurricular: 3,
    administrative:  4,
} as const;

export type FeeTypeCategory = keyof typeof CATEGORY_VALUES;

const CATEGORY_LABELS: Record<number, FeeTypeCategory> = {
    1: 'academic',
    2: 'residential',
    3: 'extracurricular',
    4: 'administrative',
};

export interface FeeTypeRecord {
    feetypeid:   string;
    name:        string;
    description: string;
    category:    FeeTypeCategory;
    mandatory:   boolean;
    color:       string;
    createdon:   string;
    modifiedon:  string;
}

export interface CreateFeeTypeRequest {
    name:        string;
    description?: string;
    category:    FeeTypeCategory;
    mandatory:   boolean;
    color:       string;
}

const SELECT = 'sms_feetypeid,sms_name,sms_description,sms_category,sms_mandatory,sms_color,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFeeType(item: any): FeeTypeRecord {
    return {
        feetypeid:   item.sms_feetypeid,
        name:        item.sms_name        ?? '',
        description: item.sms_description ?? '',
        category:    CATEGORY_LABELS[item.sms_category] ?? 'academic',
        mandatory:   item.sms_mandatory   ?? false,
        color:       item.sms_color       ?? 'blue',
        createdon:   item.createdon       ?? '',
        modifiedon:  item.modifiedon      ?? '',
    };
}

export const getFeeTypes = async (category?: FeeTypeCategory): Promise<FeeTypeRecord[]> => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (category) {
        parts.push(`$filter=${encodeURIComponent(`sms_category eq ${CATEGORY_VALUES[category]}`)}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapFeeType(item));
};

export const getFeeTypeById = async (id: string): Promise<FeeTypeRecord> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapFeeType(r);
};

export const createFeeType = async (data: CreateFeeTypeRequest): Promise<FeeTypeRecord> => {
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_category:  CATEGORY_VALUES[data.category],
        sms_mandatory: data.mandatory,
        sms_color:     data.color,
    };
    if (data.description) payload.sms_description = data.description;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await dataverseClient.post<any>(TABLE, payload);
    const id = created?.sms_feetypeid ?? created?.id;
    if (id) return getFeeTypeById(id);
    return mapFeeType({ ...payload, sms_feetypeid: '', createdon: '', modifiedon: '' });
};

export const updateFeeType = async (id: string, data: Partial<CreateFeeTypeRequest>): Promise<FeeTypeRecord> => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.category    !== undefined) payload.sms_category    = CATEGORY_VALUES[data.category];
    if (data.mandatory   !== undefined) payload.sms_mandatory   = data.mandatory;
    if (data.color       !== undefined) payload.sms_color       = data.color;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getFeeTypeById(id);
};

export const deleteFeeType = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
