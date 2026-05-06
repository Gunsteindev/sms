import { dataverseClient } from "./client";

const TABLE = 'sms_inventoryitems';

export interface InventoryItem {
    itemid:          string;
    name:            string;
    category:        string;
    quantity:        number;
    unit:            string;
    unitprice:       number;
    reorderlevel:    number;
    supplier:        string;
    suppliercontact: string;
    location:        string;
    description:     string;
    createdon:       string;
    modifiedon:      string;
}

export interface CreateInventoryItemRequest {
    name:             string;
    category?:        string;
    quantity?:        number;
    unit?:            string;
    unitprice?:       number;
    reorderlevel?:    number;
    supplier?:        string;
    suppliercontact?: string;
    location?:        string;
    description?:     string;
}

const SELECT = 'sms_inventoryitemid,sms_name,sms_category,sms_quantity,sms_unit,sms_unitprice,sms_reorderlevel,sms_supplier,sms_suppliercontact,sms_location,sms_description,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any): InventoryItem {
    return {
        itemid:          item.sms_inventoryitemid,
        name:            item.sms_name            ?? '',
        category:        item.sms_category        ?? '',
        quantity:        item.sms_quantity         ?? 0,
        unit:            item.sms_unit             ?? '',
        unitprice:       item.sms_unitprice        ?? 0,
        reorderlevel:    item.sms_reorderlevel     ?? 0,
        supplier:        item.sms_supplier         ?? '',
        suppliercontact: item.sms_suppliercontact  ?? '',
        location:        item.sms_location         ?? '',
        description:     item.sms_description      ?? '',
        createdon:       item.createdon            ?? '',
        modifiedon:      item.modifiedon           ?? '',
    };
}

export const getInventoryItems = async (category?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_name asc`];
    if (category) parts.push(`$filter=${encodeURIComponent(`sms_category eq '${category}'`)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapItem(i));
};

export const getInventoryItemById = async (id: string): Promise<InventoryItem> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapItem(r);
};

export const createInventoryItem = async (data: CreateInventoryItemRequest) => {
    const payload: Record<string, unknown> = { sms_name: data.name };
    if (data.category        !== undefined) payload.sms_category        = data.category;
    if (data.quantity        !== undefined) payload.sms_quantity        = data.quantity;
    if (data.unit            !== undefined) payload.sms_unit            = data.unit;
    if (data.unitprice       !== undefined) payload.sms_unitprice       = data.unitprice;
    if (data.reorderlevel    !== undefined) payload.sms_reorderlevel    = data.reorderlevel;
    if (data.supplier        !== undefined) payload.sms_supplier        = data.supplier;
    if (data.suppliercontact !== undefined) payload.sms_suppliercontact = data.suppliercontact;
    if (data.location        !== undefined) payload.sms_location        = data.location;
    if (data.description     !== undefined) payload.sms_description     = data.description;
    return dataverseClient.post(TABLE, payload);
};

export const updateInventoryItem = async (id: string, data: Partial<CreateInventoryItemRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.name            !== undefined) payload.sms_name            = data.name;
    if (data.category        !== undefined) payload.sms_category        = data.category;
    if (data.quantity        !== undefined) payload.sms_quantity        = data.quantity;
    if (data.unit            !== undefined) payload.sms_unit            = data.unit;
    if (data.unitprice       !== undefined) payload.sms_unitprice       = data.unitprice;
    if (data.reorderlevel    !== undefined) payload.sms_reorderlevel    = data.reorderlevel;
    if (data.supplier        !== undefined) payload.sms_supplier        = data.supplier;
    if (data.suppliercontact !== undefined) payload.sms_suppliercontact = data.suppliercontact;
    if (data.location        !== undefined) payload.sms_location        = data.location;
    if (data.description     !== undefined) payload.sms_description     = data.description;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getInventoryItemById(id);
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
