import { dataverseClient } from './client';

const TABLE = 'sms_vehiclemaintenances';

// _sms_vehicle_value = GUID of the Lookup; name comes from FormattedValue annotation
// sms_maintenancestatus = Picklist (not sms_status)
const SELECT = 'sms_vehiclemaintenanceid,sms_name,_sms_vehicle_value,sms_maintenancetype,sms_description,sms_scheduleddate,sms_completeddate,sms_cost,sms_technicianname,sms_maintenancestatus,sms_notes,createdon';

export const MAINT_TYPES: Record<number, string> = {
    1: 'Routine Service',
    2: 'Repair',
    3: 'Inspection',
    4: 'Tyre Change',
    5: 'Other',
};

export const MAINT_STATUSES: Record<number, string> = {
    1: 'Scheduled',
    2: 'In Progress',
    3: 'Completed',
    4: 'Cancelled',
};

export interface VehicleMaintenance {
    maintenanceid:   string;
    vehicleid:       string;
    vehiclename:     string;
    maintenancetype: number;
    description:     string;
    scheduleddate:   string;
    completeddate:   string;
    cost:            number;
    technicianname:  string;
    status:          number;
    notes:           string;
    createdon:       string;
}

export interface CreateMaintenanceRequest {
    vehicleid:        string;
    maintenancetype?: number;
    description?:     string;
    scheduleddate?:   string;
    completeddate?:   string;
    cost?:            number;
    technicianname?:  string;
    status?:          number;
    notes?:           string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMaintenance(item: any): VehicleMaintenance {
    return {
        maintenanceid:   item.sms_vehiclemaintenanceid,
        vehicleid:       item._sms_vehicle_value ?? '',
        vehiclename:     item['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        maintenancetype: item.sms_maintenancetype  ?? 1,
        description:     item.sms_description      ?? '',
        scheduleddate:   item.sms_scheduleddate     ? item.sms_scheduleddate.slice(0, 10) : '',
        completeddate:   item.sms_completeddate     ? item.sms_completeddate.slice(0, 10) : '',
        cost:            item.sms_cost             ?? 0,
        technicianname:  item.sms_technicianname   ?? '',
        status:          item.sms_maintenancestatus ?? 1,
        notes:           item.sms_notes            ?? '',
        createdon:       item.createdon            ?? '',
    };
}

export const getMaintenanceRecords = async (vehicleid?: string) => {
    const parts = [`$select=${SELECT}`, '$orderby=createdon desc'];
    if (vehicleid) parts.push(`$filter=${encodeURIComponent(`_sms_vehicle_value eq ${vehicleid}`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapMaintenance(i));
};

export const createMaintenanceRecord = async (data: CreateMaintenanceRequest) => {
    const typeLabel = MAINT_TYPES[data.maintenancetype ?? 1];
    const payload: Record<string, unknown> = {
        sms_name:            `Vehicle – ${typeLabel}`,
        'sms_vehicle@odata.bind': `/sms_vehicles(${data.vehicleid})`,
        sms_maintenancetype:  data.maintenancetype ?? 1,
        sms_maintenancestatus: data.status ?? 1,
    };
    if (data.description    !== undefined) payload.sms_description    = data.description;
    if (data.scheduleddate  !== undefined) payload.sms_scheduleddate  = data.scheduleddate;
    if (data.completeddate  !== undefined) payload.sms_completeddate  = data.completeddate;
    if (data.cost           !== undefined) payload.sms_cost           = data.cost;
    if (data.technicianname !== undefined) payload.sms_technicianname = data.technicianname;
    if (data.notes          !== undefined) payload.sms_notes          = data.notes;
    return dataverseClient.post(TABLE, payload);
};

export const updateMaintenanceRecord = async (id: string, data: Partial<CreateMaintenanceRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.vehicleid       !== undefined) payload['sms_vehicle@odata.bind'] = `/sms_vehicles(${data.vehicleid})`;
    if (data.maintenancetype !== undefined) payload.sms_maintenancetype  = data.maintenancetype;
    if (data.description     !== undefined) payload.sms_description      = data.description;
    if (data.scheduleddate   !== undefined) payload.sms_scheduleddate    = data.scheduleddate;
    if (data.completeddate   !== undefined) payload.sms_completeddate    = data.completeddate;
    if (data.cost            !== undefined) payload.sms_cost             = data.cost;
    if (data.technicianname  !== undefined) payload.sms_technicianname   = data.technicianname;
    if (data.status          !== undefined) payload.sms_maintenancestatus = data.status;
    if (data.notes           !== undefined) payload.sms_notes            = data.notes;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
};

export const deleteMaintenanceRecord = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
