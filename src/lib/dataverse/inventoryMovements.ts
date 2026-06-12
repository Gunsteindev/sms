import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_inventorymovements';

// movementtype: 1=Stock In, 2=Stock Out, 3=Adjustment (set absolute qty), 4=Loss/Damage, 5=Return

export interface InventoryMovement {
    movementid:     string;
    name:           string;
    itemid:         string;
    itemname:       string;
    movementtype:   number;
    quantity:       number;
    quantitybefore: number;
    quantityafter:  number;
    reason:         string;
    notes:          string;
    movedby:        string;
    createdon:      string;
}

export interface CreateMovementRequest {
    name:            string;
    itemid:          string;
    itemname?:       string;
    movementtype:    number;
    quantity:        number;
    quantitybefore?: number;
    quantityafter?:  number;
    reason?:         string;
    notes?:          string;
    movedby?:        string;
}

export interface GetMovementsParams {
    itemid?:       string;
    movementtype?: number;
    from?:         string;
    to?:           string;
}

const SELECT = 'sms_inventorymovementid,sms_name,sms_itemid,sms_itemname,sms_movementtype,sms_quantity,sms_quantitybefore,sms_quantityafter,sms_reason,sms_notes,sms_movedby,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMovement(item: any): InventoryMovement {
    return {
        movementid:     item.sms_inventorymovementid,
        name:           item.sms_name            ?? '',
        itemid:         item.sms_itemid          ?? '',
        itemname:       item.sms_itemname        ?? '',
        movementtype:   item.sms_movementtype    ?? 1,
        quantity:       item.sms_quantity        ?? 0,
        quantitybefore: item.sms_quantitybefore  ?? 0,
        quantityafter:  item.sms_quantityafter   ?? 0,
        reason:         item.sms_reason          ?? '',
        notes:          item.sms_notes           ?? '',
        movedby:        item.sms_movedby         ?? '',
        createdon:      item.createdon           ?? '',
    };
}

export const getMovements = async (params?: GetMovementsParams): Promise<InventoryMovement[]> => {
    const filters: string[] = [];
    if (params?.itemid)       filters.push(`sms_itemid eq '${params.itemid}'`);
    if (params?.movementtype) filters.push(`sms_movementtype eq ${params.movementtype}`);
    if (params?.from)         filters.push(`createdon ge ${params.from}`);
    if (params?.to)           filters.push(`createdon le ${params.to}`);

    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`, `$top=200`];
    if (filters.length) parts.push(`$filter=${encodeURIComponent(filters.join(' and '))}`);

    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapMovement);
};

export const getMovementById = async (id: string): Promise<InventoryMovement> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapMovement(r);
};

export const createMovement = async (data: CreateMovementRequest): Promise<InventoryMovement> => {
    const payload: Record<string, unknown> = {
        sms_name:         data.name,
        sms_itemid:       data.itemid,
        sms_movementtype: data.movementtype,
        sms_quantity:     data.quantity,
    };
    if (data.itemname       !== undefined) payload.sms_itemname       = data.itemname;
    if (data.quantitybefore !== undefined) payload.sms_quantitybefore = data.quantitybefore;
    if (data.quantityafter  !== undefined) payload.sms_quantityafter  = data.quantityafter;
    if (data.reason         !== undefined) payload.sms_reason         = data.reason;
    if (data.notes          !== undefined) payload.sms_notes          = data.notes;
    if (data.movedby        !== undefined) payload.sms_movedby        = data.movedby;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const deleteMovement = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
