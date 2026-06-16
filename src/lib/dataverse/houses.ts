import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_houses';

// House type option set
// 1=Boarding House, 2=Day House, 3=Class Stream
export type HouseType = 1 | 2 | 3;

export const HOUSE_TYPE_LABELS: Record<number, string> = {
    1: 'Boarding House',
    2: 'Day House',
    3: 'Class Stream',
};

export interface House {
    houseid:      string;
    name:         string;
    type:         HouseType;
    typelabel:    string;
    color:        string;
    description:  string;
    ordernumber:  number;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateHouseRequest {
    name:          string;
    type:          HouseType;
    color?:        string;
    description?:  string;
    ordernumber?:  number;
}

const SELECT = 'sms_houseid,sms_name,sms_type,sms_color,sms_description,sms_ordernumber,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHouse(item: any): House {
    const type = item.sms_type ?? 1;
    return {
        houseid:     item.sms_houseid,
        name:        item.sms_name        ?? '',
        type:        type as HouseType,
        typelabel:   HOUSE_TYPE_LABELS[type] ?? '',
        color:       item.sms_color        ?? '',
        description: item.sms_description  ?? '',
        ordernumber: item.sms_ordernumber  ?? 0,
        createdon:   item.createdon        ?? '',
        modifiedon:  item.modifiedon       ?? '',
    };
}

export const getHouses = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_ordernumber asc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapHouse(item));
};

export const getHouseById = async (id: string): Promise<House> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapHouse(r);
};

export const createHouse = async (data: CreateHouseRequest): Promise<House> => {
    const payload: Record<string, unknown> = {
        sms_name: data.name,
        sms_type: data.type,
    };
    if (data.color       !== undefined) payload.sms_color       = data.color;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.ordernumber !== undefined) payload.sms_ordernumber = data.ordernumber;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(TABLE, payload);
    return mapHouse(result);
};

export const updateHouse = async (id: string, data: Partial<CreateHouseRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.type        !== undefined) payload.sms_type        = data.type;
    if (data.color       !== undefined) payload.sms_color       = data.color;
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.ordernumber !== undefined) payload.sms_ordernumber = data.ordernumber;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getHouseById(id);
};

export const deleteHouse = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
