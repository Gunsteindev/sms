import { dataverseClient } from './client';

const TABLE = 'sms_poolrentals';

// category: 1=Swimsuit, 2=Swimming Cap, 3=Goggles, 4=Fins, 5=Kickboard, 6=Other

export interface PoolRental {
    rentalid:   string;
    name:       string;
    category:   number;
    size:       string;
    totalqty:   number;
    available:  number;
    inuse:      number;
    cleaning:   number;
    damaged:    number;
    rentalfee:  number;
    depositfee: number;
    createdon:  string;
}

export interface CreateRentalRequest {
    name:        string;
    category?:   number;
    size?:       string;
    totalqty?:   number;
    available?:  number;
    inuse?:      number;
    cleaning?:   number;
    damaged?:    number;
    rentalfee?:  number;
    depositfee?: number;
}

const SELECT = 'sms_poolrentalid,sms_name,sms_category,sms_size,sms_totalqty,sms_available,sms_inuse,sms_cleaning,sms_damaged,sms_rentalfee,sms_depositfee,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRental(item: any): PoolRental {
    return {
        rentalid:   item.sms_poolrentalid,
        name:       item.sms_name       ?? '',
        category:   item.sms_category   ?? 1,
        size:       item.sms_size       ?? '',
        totalqty:   item.sms_totalqty   ?? 0,
        available:  item.sms_available  ?? 0,
        inuse:      item.sms_inuse      ?? 0,
        cleaning:   item.sms_cleaning   ?? 0,
        damaged:    item.sms_damaged    ?? 0,
        rentalfee:  item.sms_rentalfee  ?? 0,
        depositfee: item.sms_depositfee ?? 0,
        createdon:  item.createdon      ?? '',
    };
}

export const getRentals = async (): Promise<PoolRental[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$orderby=sms_name asc`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapRental(i));
};

export const getRentalById = async (id: string): Promise<PoolRental> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapRental(r);
};

export const createRental = async (data: CreateRentalRequest): Promise<PoolRental> => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.category   !== undefined) payload.sms_category   = data.category;
    if (data.size       !== undefined) payload.sms_size       = data.size;
    if (data.totalqty   !== undefined) payload.sms_totalqty   = data.totalqty;
    if (data.available  !== undefined) payload.sms_available  = data.available;
    if (data.inuse      !== undefined) payload.sms_inuse      = data.inuse;
    if (data.cleaning   !== undefined) payload.sms_cleaning   = data.cleaning;
    if (data.damaged    !== undefined) payload.sms_damaged    = data.damaged;
    if (data.rentalfee  !== undefined) payload.sms_rentalfee  = data.rentalfee;
    if (data.depositfee !== undefined) payload.sms_depositfee = data.depositfee;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateRental = async (id: string, data: Partial<CreateRentalRequest>): Promise<PoolRental> => {
    const payload: Record<string, unknown> = {};
    if (data.name       !== undefined) payload.sms_name       = data.name;
    if (data.category   !== undefined) payload.sms_category   = data.category;
    if (data.size       !== undefined) payload.sms_size       = data.size;
    if (data.totalqty   !== undefined) payload.sms_totalqty   = data.totalqty;
    if (data.available  !== undefined) payload.sms_available  = data.available;
    if (data.inuse      !== undefined) payload.sms_inuse      = data.inuse;
    if (data.cleaning   !== undefined) payload.sms_cleaning   = data.cleaning;
    if (data.damaged    !== undefined) payload.sms_damaged    = data.damaged;
    if (data.rentalfee  !== undefined) payload.sms_rentalfee  = data.rentalfee;
    if (data.depositfee !== undefined) payload.sms_depositfee = data.depositfee;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getRentalById(id);
};

export const deleteRental = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
