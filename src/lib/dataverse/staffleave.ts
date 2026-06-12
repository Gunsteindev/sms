import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_staffleaves';

// LeaveType: 1=Annual, 2=Sick, 3=Maternity/Paternity, 4=Compassionate, 5=Study, 6=Unpaid
// Status:    1=Pending, 2=Approved, 3=Rejected, 4=Cancelled

export interface StaffLeave {
    leaveid:      string;
    employeeid:   string;
    employeename: string;
    leavetype:    number;
    startdate:    string;
    enddate:      string;
    days:         number;
    reason:       string;
    status:       number;
    approvedby:   string;
    comments:     string;
    createdon:    string;
    modifiedon:   string;
}

export interface CreateStaffLeaveRequest {
    employeeid:   string;
    employeename?: string;
    leavetype:    number;
    startdate:    string;
    enddate:      string;
    days?:        number;
    reason?:      string;
    status?:      number;
    approvedby?:  string;
    comments?:    string;
}

const SELECT = 'sms_staffleaveid,sms_employeeid,sms_employeename,sms_leavetype,sms_startdate,sms_enddate,sms_days,sms_reason,sms_status,sms_approvedby,sms_comments,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLeave(item: any): StaffLeave {
    return {
        leaveid:      item.sms_staffleaveid,
        employeeid:   item.sms_employeeid   ?? '',
        employeename: item.sms_employeename ?? '',
        leavetype:    item.sms_leavetype    ?? 1,
        startdate:    item.sms_startdate    ?? '',
        enddate:      item.sms_enddate      ?? '',
        days:         item.sms_days         ?? 0,
        reason:       item.sms_reason       ?? '',
        status:       item.sms_status       ?? 1,
        approvedby:   item.sms_approvedby   ?? '',
        comments:     item.sms_comments     ?? '',
        createdon:    item.createdon        ?? '',
        modifiedon:   item.modifiedon       ?? '',
    };
}

export const getStaffLeaves = async (status?: number, employeeid?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_startdate desc`];
    const conditions: string[] = [];
    if (status)     conditions.push(`sms_status eq ${status}`);
    if (employeeid) conditions.push(`sms_employeeid eq '${employeeid}'`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map(mapLeave);
};

export const getStaffLeaveById = async (id: string): Promise<StaffLeave> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapLeave(r);
};

export const createStaffLeave = async (data: CreateStaffLeaveRequest) => {
    const payload: Record<string, unknown> = {
        sms_employeeid: data.employeeid,
        sms_leavetype:  data.leavetype,
        sms_startdate:  data.startdate,
        sms_enddate:    data.enddate,
    };
    if (data.employeename !== undefined) payload.sms_employeename = data.employeename;
    if (data.days         !== undefined) payload.sms_days         = data.days;
    if (data.reason       !== undefined) payload.sms_reason       = data.reason;
    if (data.status       !== undefined) payload.sms_status       = data.status;
    if (data.approvedby   !== undefined) payload.sms_approvedby   = data.approvedby;
    if (data.comments     !== undefined) payload.sms_comments     = data.comments;
    return dataverseClient.post(TABLE, payload);
};

export const updateStaffLeave = async (id: string, data: Partial<CreateStaffLeaveRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.employeeid   !== undefined) payload.sms_employeeid   = data.employeeid;
    if (data.employeename !== undefined) payload.sms_employeename = data.employeename;
    if (data.leavetype    !== undefined) payload.sms_leavetype    = data.leavetype;
    if (data.startdate    !== undefined) payload.sms_startdate    = data.startdate;
    if (data.enddate      !== undefined) payload.sms_enddate      = data.enddate;
    if (data.days         !== undefined) payload.sms_days         = data.days;
    if (data.reason       !== undefined) payload.sms_reason       = data.reason;
    if (data.status       !== undefined) payload.sms_status       = data.status;
    if (data.approvedby   !== undefined) payload.sms_approvedby   = data.approvedby;
    if (data.comments     !== undefined) payload.sms_comments     = data.comments;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getStaffLeaveById(id);
};

export const deleteStaffLeave = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
