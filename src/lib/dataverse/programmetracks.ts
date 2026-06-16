import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_programmetracks';

export interface ProgrammeTrack {
    programmetrackid: string;
    name:             string;
    abbreviation:     string;
    description:      string;
    color:            string;
    ordernumber:      number;
    createdon:        string;
    modifiedon:       string;
}

export interface CreateProgrammeTrackRequest {
    name:          string;
    abbreviation:  string;
    description?:  string;
    color?:        string;
    ordernumber?:  number;
}

const SELECT = 'sms_programmetrackid,sms_name,sms_abbreviation,sms_description,sms_color,sms_ordernumber,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProgrammeTrack(item: any): ProgrammeTrack {
    return {
        programmetrackid: item.sms_programmetrackid,
        name:             item.sms_name        ?? '',
        abbreviation:     item.sms_abbreviation ?? '',
        description:      item.sms_description  ?? '',
        color:            item.sms_color        ?? '',
        ordernumber:      item.sms_ordernumber  ?? 0,
        createdon:        item.createdon        ?? '',
        modifiedon:       item.modifiedon       ?? '',
    };
}

export const getProgrammeTracks = async (search?: string, top = 200) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_ordernumber asc`, `$top=${top}`];
    if (search) parts.push(`$filter=${encodeURIComponent(`contains(sms_name,'${search}')`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapProgrammeTrack(item));
};

export const getProgrammeTrackById = async (id: string): Promise<ProgrammeTrack> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapProgrammeTrack(r);
};

export const createProgrammeTrack = async (data: CreateProgrammeTrackRequest): Promise<ProgrammeTrack> => {
    const payload: Record<string, unknown> = {
        sms_name:         data.name,
        sms_abbreviation: data.abbreviation,
    };
    if (data.description !== undefined) payload.sms_description = data.description;
    if (data.color       !== undefined) payload.sms_color       = data.color;
    if (data.ordernumber !== undefined) payload.sms_ordernumber = data.ordernumber;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dataverseClient.post<any>(TABLE, payload);
    return mapProgrammeTrack(result);
};

export const updateProgrammeTrack = async (id: string, data: Partial<CreateProgrammeTrackRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name         = data.name;
    if (data.abbreviation !== undefined) payload.sms_abbreviation = data.abbreviation;
    if (data.description !== undefined) payload.sms_description  = data.description;
    if (data.color       !== undefined) payload.sms_color        = data.color;
    if (data.ordernumber !== undefined) payload.sms_ordernumber   = data.ordernumber;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getProgrammeTrackById(id);
};

export const deleteProgrammeTrack = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
