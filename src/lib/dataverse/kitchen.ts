import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_kitchenmenus';

// Meal type: 1=Breakfast 2=Lunch 3=Dinner 4=Snack
// Status:    1=Planned   2=Served 3=Cancelled  (stored as sms_kitchenmenustatus)

export interface KitchenMenu {
    menuid:       string;
    name:         string;
    menudate:     string;
    mealtype:     number;
    items:        string;
    price:        number;
    totalserved:  number;
    status:       number;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateMenuRequest {
    name?:        string;
    menudate:     string;
    mealtype:     number;
    items?:       string;
    price?:       number;
    totalserved?: number;
    status?:      number;
}

const SELECT = 'sms_kitchenmenuid,sms_name,sms_menudate,sms_mealtype,sms_items,sms_price,sms_totalserved,sms_kitchenmenustatus,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMenu(item: any): KitchenMenu {
    const mealLabels: Record<number, string> = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack' };
    const date = item.sms_menudate?.slice(0, 10) ?? '';
    return {
        menuid:      item.sms_kitchenmenuid,
        name:        item.sms_name               ?? `${mealLabels[item.sms_mealtype] ?? 'Meal'} – ${date}`,
        menudate:    date,
        mealtype:    item.sms_mealtype            ?? 2,
        items:       item.sms_items               ?? '',
        price:       item.sms_price               ?? 0,
        totalserved: item.sms_totalserved         ?? 0,
        status:      item.sms_kitchenmenustatus   ?? 1,
        createdon:   item.createdon               ?? '',
        modifiedon:  item.modifiedon              ?? '',
    };
}

export const getMenus = async (params?: { date?: string; mealtype?: number; status?: number }): Promise<KitchenMenu[]> => {
    const conds: string[] = [];
    if (params?.date)     conds.push(`sms_menudate eq ${params.date}`);
    if (params?.mealtype) conds.push(`sms_mealtype eq ${params.mealtype}`);
    if (params?.status)   conds.push(`sms_kitchenmenustatus eq ${params.status}`);
    const parts = [`$select=${SELECT}`, `$orderby=sms_menudate desc,sms_mealtype asc`, `$top=500`];
    if (conds.length) parts.push(`$filter=${encodeURIComponent(conds.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapMenu);
};

export const getMenuById = async (id: string): Promise<KitchenMenu> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapMenu(r);
};

export const createMenu = async (data: CreateMenuRequest): Promise<KitchenMenu> => {
    const mealLabels: Record<number, string> = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack' };
    const payload: Record<string, unknown> = {
        sms_name:               data.name ?? `${mealLabels[data.mealtype] ?? 'Meal'} – ${data.menudate}`,
        sms_menudate:           data.menudate,
        sms_mealtype:           data.mealtype,
        sms_kitchenmenustatus:  data.status ?? 1,
    };
    if (data.items       !== undefined) payload.sms_items       = data.items;
    if (data.price       !== undefined) payload.sms_price       = data.price;
    if (data.totalserved !== undefined) payload.sms_totalserved = data.totalserved;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapMenu(await dataverseClient.post(TABLE, payload) as any);
};

export const updateMenu = async (id: string, data: Partial<CreateMenuRequest>): Promise<KitchenMenu> => {
    const payload: Record<string, unknown> = {};
    if (data.name        !== undefined) payload.sms_name               = data.name;
    if (data.menudate    !== undefined) payload.sms_menudate           = data.menudate;
    if (data.mealtype    !== undefined) payload.sms_mealtype           = data.mealtype;
    if (data.items       !== undefined) payload.sms_items              = data.items;
    if (data.price       !== undefined) payload.sms_price              = data.price;
    if (data.totalserved !== undefined) payload.sms_totalserved        = data.totalserved;
    if (data.status      !== undefined) payload.sms_kitchenmenustatus  = data.status;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getMenuById(id);
};

export const deleteMenu = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
