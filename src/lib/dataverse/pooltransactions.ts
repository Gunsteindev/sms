import { dataverseClient, type DvList } from './client';

const TABLE = 'sms_pooltransactions';

// transtype:     1=Entry Fee, 2=Snack Sale, 3=Drink Sale, 4=Swimwear Sale, 5=Rental, 6=Other Sale
// paymentmethod: 1=Cash, 2=Mobile Money, 3=Card

export interface PoolTransaction {
    transactionid:  string;
    name:           string;
    transdate:      string;
    sessionref:     string;
    transtype:      number;
    itemname:       string;
    quantity:       number;
    unitprice:      number;
    totalamount:    number;
    customername:   string;
    paymentmethod:  number;
    notes:          string;
    createdon:      string;
}

export interface CreateTransactionRequest {
    name:           string;
    transdate:      string;
    sessionref?:    string;
    transtype?:     number;
    itemname?:      string;
    quantity?:      number;
    unitprice?:     number;
    totalamount?:   number;
    customername?:  string;
    paymentmethod?: number;
    notes?:         string;
}

export interface GetTransactionsParams {
    sessionref?: string;
    transtype?:  number;
    from?:       string;
    to?:         string;
}

const SELECT = 'sms_pooltransactionid,sms_name,sms_transdate,sms_sessionref,sms_transtype,sms_itemname,sms_quantity,sms_unitprice,sms_totalamount,sms_customername,sms_paymentmethod,sms_notes,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(item: any): PoolTransaction {
    return {
        transactionid:  item.sms_pooltransactionid,
        name:           item.sms_name           ?? '',
        transdate:      item.sms_transdate       ?? '',
        sessionref:     item.sms_sessionref      ?? '',
        transtype:      item.sms_transtype       ?? 1,
        itemname:       item.sms_itemname        ?? '',
        quantity:       item.sms_quantity        ?? 0,
        unitprice:      item.sms_unitprice       ?? 0,
        totalamount:    item.sms_totalamount     ?? 0,
        customername:   item.sms_customername    ?? '',
        paymentmethod:  item.sms_paymentmethod   ?? 1,
        notes:          item.sms_notes           ?? '',
        createdon:      item.createdon           ?? '',
    };
}

export const getTransactions = async (params?: GetTransactionsParams): Promise<PoolTransaction[]> => {
    const filters: string[] = [];
    if (params?.sessionref) filters.push(`sms_sessionref eq '${params.sessionref}'`);
    if (params?.transtype)  filters.push(`sms_transtype eq ${params.transtype}`);
    if (params?.from)       filters.push(`sms_transdate ge ${params.from}`);
    if (params?.to)         filters.push(`sms_transdate le ${params.to}`);

    const parts = [`$select=${SELECT}`, `$orderby=createdon desc`];
    if (filters.length) parts.push(`$filter=${encodeURIComponent(filters.join(' and '))}`);

    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapTransaction);
};

export const getTransactionById = async (id: string): Promise<PoolTransaction> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapTransaction(r);
};

export const createTransaction = async (data: CreateTransactionRequest): Promise<PoolTransaction> => {
    const payload: Record<string, unknown> = {
        sms_name:      data.name,
        sms_transdate: data.transdate,
    };
    if (data.sessionref    !== undefined) payload.sms_sessionref    = data.sessionref;
    if (data.transtype     !== undefined) payload.sms_transtype     = data.transtype;
    if (data.itemname      !== undefined) payload.sms_itemname      = data.itemname;
    if (data.quantity      !== undefined) payload.sms_quantity      = data.quantity;
    if (data.unitprice     !== undefined) payload.sms_unitprice     = data.unitprice;
    if (data.totalamount   !== undefined) payload.sms_totalamount   = data.totalamount;
    if (data.customername  !== undefined) payload.sms_customername  = data.customername;
    if (data.paymentmethod !== undefined) payload.sms_paymentmethod = data.paymentmethod;
    if (data.notes         !== undefined) payload.sms_notes         = data.notes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateTransaction = async (id: string, data: Partial<CreateTransactionRequest>): Promise<PoolTransaction> => {
    const payload: Record<string, unknown> = {};
    if (data.name          !== undefined) payload.sms_name          = data.name;
    if (data.transdate     !== undefined) payload.sms_transdate     = data.transdate;
    if (data.sessionref    !== undefined) payload.sms_sessionref    = data.sessionref;
    if (data.transtype     !== undefined) payload.sms_transtype     = data.transtype;
    if (data.itemname      !== undefined) payload.sms_itemname      = data.itemname;
    if (data.quantity      !== undefined) payload.sms_quantity      = data.quantity;
    if (data.unitprice     !== undefined) payload.sms_unitprice     = data.unitprice;
    if (data.totalamount   !== undefined) payload.sms_totalamount   = data.totalamount;
    if (data.customername  !== undefined) payload.sms_customername  = data.customername;
    if (data.paymentmethod !== undefined) payload.sms_paymentmethod = data.paymentmethod;
    if (data.notes         !== undefined) payload.sms_notes         = data.notes;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getTransactionById(id);
};

export const deleteTransaction = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
