import { dataverseClient } from './client';

const TABLE = 'sms_routeassignments';

const SELECT = 'sms_routeassignmentid,sms_name,sms_studentid,sms_studentname,sms_vehicleid,sms_vehiclename,sms_routename,sms_pickuppoint,sms_pickuptime,sms_status,createdon';

export interface RouteAssignment {
    assignmentid: string;
    studentid:    string;
    studentname:  string;
    vehicleid:    string;
    vehiclename:  string;
    routename:    string;
    pickuppoint:  string;
    pickuptime:   string;
    status:       number;
    createdon:    string;
}

export interface CreateRouteAssignmentRequest {
    studentid:    string;
    studentname:  string;
    vehicleid:    string;
    vehiclename:  string;
    routename?:   string;
    pickuppoint?: string;
    pickuptime?:  string;
    status?:      number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssignment(item: any): RouteAssignment {
    return {
        assignmentid: item.sms_routeassignmentid,
        studentid:    item.sms_studentid   ?? '',
        studentname:  item.sms_studentname ?? '',
        vehicleid:    item.sms_vehicleid   ?? '',
        vehiclename:  item.sms_vehiclename ?? '',
        routename:    item.sms_routename   ?? '',
        pickuppoint:  item.sms_pickuppoint ?? '',
        pickuptime:   item.sms_pickuptime  ?? '',
        status:       item.sms_status      ?? 1,
        createdon:    item.createdon       ?? '',
    };
}

export const getRouteAssignments = async (vehicleid?: string) => {
    const parts = [`$select=${SELECT}`, '$orderby=sms_studentname asc'];
    if (vehicleid) parts.push(`$filter=${encodeURIComponent(`sms_vehicleid eq '${vehicleid}'`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapAssignment(i));
};

export const createRouteAssignment = async (data: CreateRouteAssignmentRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:        `${data.studentname} – ${data.vehiclename}`,
        sms_studentid:   data.studentid,
        sms_studentname: data.studentname,
        sms_vehicleid:   data.vehicleid,
        sms_vehiclename: data.vehiclename,
        sms_status:      data.status ?? 1,
    };
    if (data.routename   !== undefined) payload.sms_routename   = data.routename;
    if (data.pickuppoint !== undefined) payload.sms_pickuppoint = data.pickuppoint;
    if (data.pickuptime  !== undefined) payload.sms_pickuptime  = data.pickuptime;
    return dataverseClient.post(TABLE, payload);
};

export const updateRouteAssignment = async (id: string, data: Partial<CreateRouteAssignmentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.vehicleid   !== undefined) { payload.sms_vehicleid = data.vehicleid; payload.sms_vehiclename = data.vehiclename; }
    if (data.routename   !== undefined) payload.sms_routename   = data.routename;
    if (data.pickuppoint !== undefined) payload.sms_pickuppoint = data.pickuppoint;
    if (data.pickuptime  !== undefined) payload.sms_pickuptime  = data.pickuptime;
    if (data.status      !== undefined) payload.sms_status      = data.status;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
};

export const deleteRouteAssignment = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
