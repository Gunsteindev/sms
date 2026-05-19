import { dataverseClient } from './client';

const TABLE = 'sms_routeassignments';

// _sms_student_value / _sms_vehicle_value = GUID of the lookup
// sms_studentname / sms_vehiclename = auto-populated companion strings (read-only)
// sms_routestatus = Picklist (not sms_status)
const SELECT = 'sms_routeassignmentid,sms_name,_sms_student_value,_sms_vehicle_value,sms_routename,sms_pickuppoint,sms_pickuptime,sms_routestatus,createdon';

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
    vehicleid:    string;
    routename?:   string;
    pickuppoint?: string;
    pickuptime?:  string;
    status?:      number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssignment(item: any): RouteAssignment {
    return {
        assignmentid: item.sms_routeassignmentid,
        studentid:    item._sms_student_value  ?? '',
        studentname:  item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        vehicleid:    item._sms_vehicle_value  ?? '',
        vehiclename:  item['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        routename:    item.sms_routename       ?? '',
        pickuppoint:  item.sms_pickuppoint     ?? '',
        pickuptime:   item.sms_pickuptime      ?? '',
        status:       item.sms_routestatus     ?? 1,
        createdon:    item.createdon           ?? '',
    };
}

export const getRouteAssignments = async (vehicleid?: string) => {
    const parts = [`$select=${SELECT}`, '$orderby=sms_name asc'];
    if (vehicleid) parts.push(`$filter=${encodeURIComponent(`_sms_vehicle_value eq ${vehicleid}`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapAssignment(i));
};

export const createRouteAssignment = async (data: CreateRouteAssignmentRequest) => {
    const payload: Record<string, unknown> = {
        'sms_student@odata.bind': `/sms_students(${data.studentid})`,
        'sms_vehicle@odata.bind': `/sms_vehicles(${data.vehicleid})`,
        sms_routestatus: data.status ?? 1,
    };
    if (data.routename   !== undefined) payload.sms_routename   = data.routename;
    if (data.pickuppoint !== undefined) payload.sms_pickuppoint = data.pickuppoint;
    if (data.pickuptime  !== undefined) payload.sms_pickuptime  = data.pickuptime;
    return dataverseClient.post(TABLE, payload);
};

export const updateRouteAssignment = async (id: string, data: Partial<CreateRouteAssignmentRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.vehicleid   !== undefined) payload['sms_vehicle@odata.bind'] = `/sms_vehicles(${data.vehicleid})`;
    if (data.studentid   !== undefined) payload['sms_student@odata.bind'] = `/sms_students(${data.studentid})`;
    if (data.routename   !== undefined) payload.sms_routename   = data.routename;
    if (data.pickuppoint !== undefined) payload.sms_pickuppoint = data.pickuppoint;
    if (data.pickuptime  !== undefined) payload.sms_pickuptime  = data.pickuptime;
    if (data.status      !== undefined) payload.sms_routestatus = data.status;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
};

export const deleteRouteAssignment = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
