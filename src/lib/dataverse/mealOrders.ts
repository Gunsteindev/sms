import { dataverseClient } from './client';

const TABLE = 'sms_mealorders';

// Payment status: 1=Paid 2=Unpaid 3=Free/Subsidized  (stored as sms_paymentstatus picklist)
// sms_student is a Lookup → sms_students; reads as _sms_student_value + FormattedValue annotation
// sms_menudate (String) is used to store the menu label/name for display

export interface MealOrder {
    orderid:       string;
    name:          string;
    menuid:        string;
    menuname:      string;
    mealtype:      number;
    studentid:     string;
    studentname:   string;
    orderdate:     string;
    amount:        number;
    paymentstatus: number;
    createdon:     string;
}

export interface CreateOrderRequest {
    menuid:         string;
    menuname:       string;
    mealtype:       number;
    studentid:      string;
    studentname:    string;
    orderdate:      string;
    amount?:        number;
    paymentstatus?: number;
}

const SELECT = [
    'sms_mealorderid', 'sms_name',
    'sms_menuid', 'sms_menudate', 'sms_mealtype',
    '_sms_student_value', 'sms_orderdate',
    'sms_amount', 'sms_paymentstatus', 'createdon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(item: any): MealOrder {
    return {
        orderid:       item.sms_mealorderid,
        name:          item.sms_name           ?? '',
        menuid:        item.sms_menuid         ?? '',
        menuname:      item.sms_menudate       ?? '',  // sms_menudate (String) stores the menu label
        mealtype:      item.sms_mealtype       ?? 2,
        studentid:     item._sms_student_value ?? '',
        studentname:   item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        orderdate:     item.sms_orderdate?.slice(0, 10) ?? '',
        amount:        item.sms_amount         ?? 0,
        paymentstatus: item.sms_paymentstatus  ?? 1,
        createdon:     item.createdon          ?? '',
    };
}

export const getOrders = async (params?: { menuid?: string; date?: string; paymentstatus?: number }): Promise<MealOrder[]> => {
    const conds: string[] = [];
    if (params?.menuid)        conds.push(`sms_menuid eq '${params.menuid}'`);
    if (params?.date)          conds.push(`sms_orderdate eq ${params.date}`);
    if (params?.paymentstatus) conds.push(`sms_paymentstatus eq ${params.paymentstatus}`);
    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`, `$top=500`];
    if (conds.length) parts.push(`$filter=${encodeURIComponent(conds.join(' and '))}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((i: any) => mapOrder(i));
};

export const createOrder = async (data: CreateOrderRequest): Promise<MealOrder> => {
    const payload: Record<string, unknown> = {
        sms_name:          `${data.studentname} – ${data.menuname}`,
        sms_menuid:        data.menuid,
        sms_menudate:      data.menuname,   // stored in sms_menudate (String)
        sms_mealtype:      data.mealtype,
        'sms_student@odata.bind': `/sms_students(${data.studentid})`,
        sms_orderdate:     data.orderdate,
        sms_amount:        data.amount        ?? 0,
        sms_paymentstatus: data.paymentstatus ?? 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapOrder(await dataverseClient.post(TABLE, payload) as any);
};

export const deleteOrder = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
