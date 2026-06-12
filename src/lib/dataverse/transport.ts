import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_vehicles';

// VehicleType: 1=Bus, 2=Minibus, 3=Van, 4=Motorcycle, 5=Car
// Status:      1=Active, 2=Maintenance, 3=Retired

export interface Vehicle {
    vehicleid:    string;
    name:         string;
    plate:        string;
    vehicletype:  number;
    capacity:     number;
    driver:       string;
    driverphone:  string;
    year:         number;
    color:        string;
    status:       number;
    notes:        string;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateVehicleRequest {
    name:          string;
    plate?:        string;
    vehicletype?:  number;
    capacity?:     number;
    driver?:       string;
    driverphone?:  string;
    year?:         number;
    color?:        string;
    status?:       number;
    notes?:        string;
}

const SELECT = 'sms_vehicleid,sms_name,sms_plate,sms_vehicletype,sms_capacity,sms_driver,sms_driverphone,sms_year,sms_color,sms_status,sms_notes,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVehicle(item: any): Vehicle {
    return {
        vehicleid:   item.sms_vehicleid,
        name:        item.sms_name        ?? '',
        plate:       item.sms_plate       ?? '',
        vehicletype: item.sms_vehicletype ?? 1,
        capacity:    item.sms_capacity    ?? 0,
        driver:      item.sms_driver      ?? '',
        driverphone: item.sms_driverphone ?? '',
        year:        item.sms_year        ?? 0,
        color:       item.sms_color       ?? '',
        status:      item.sms_status      ?? 1,
        notes:       item.sms_notes       ?? '',
        createdon:   item.createdon       ?? '',
        modifiedon:  item.modifiedon      ?? '',
    };
}

export const getVehicles = async (status?: number) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (status) parts.push(`$filter=${encodeURIComponent(`sms_status eq ${status}`)}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapVehicle);
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapVehicle(r);
};

export const createVehicle = async (data: CreateVehicleRequest) => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.plate       !== undefined) payload.sms_plate       = data.plate;
    if (data.vehicletype !== undefined) payload.sms_vehicletype = data.vehicletype;
    if (data.capacity    !== undefined) payload.sms_capacity    = data.capacity;
    if (data.driver      !== undefined) payload.sms_driver      = data.driver;
    if (data.driverphone !== undefined) payload.sms_driverphone = data.driverphone;
    if (data.year        !== undefined) payload.sms_year        = data.year;
    if (data.color       !== undefined) payload.sms_color       = data.color;
    if (data.status      !== undefined) payload.sms_status      = data.status;
    if (data.notes       !== undefined) payload.sms_notes       = data.notes;
    return dataverseClient.post(TABLE, payload);
};

export const updateVehicle = async (id: string, data: Partial<CreateVehicleRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name        = data.name;
    if (data.plate       !== undefined) payload.sms_plate       = data.plate;
    if (data.vehicletype !== undefined) payload.sms_vehicletype = data.vehicletype;
    if (data.capacity    !== undefined) payload.sms_capacity    = data.capacity;
    if (data.driver      !== undefined) payload.sms_driver      = data.driver;
    if (data.driverphone !== undefined) payload.sms_driverphone = data.driverphone;
    if (data.year        !== undefined) payload.sms_year        = data.year;
    if (data.color       !== undefined) payload.sms_color       = data.color;
    if (data.status      !== undefined) payload.sms_status      = data.status;
    if (data.notes       !== undefined) payload.sms_notes       = data.notes;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getVehicleById(id);
};

export const deleteVehicle = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
