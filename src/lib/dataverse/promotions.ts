import { dataverseClient } from "./client";
import { updateStudent } from "./students";
import { getClassById } from "./classes";

const TABLE = 'sms_promotions';

// Promotion status option set
// 1=Promoted, 2=Retained, 3=Transferred, 4=Graduated
export type PromotionStatus = 1 | 2 | 3 | 4;

export const PROMOTION_STATUS_LABELS: Record<number, string> = {
    1: 'Promoted',
    2: 'Retained',
    3: 'Transferred',
    4: 'Graduated',
};

export interface Promotion {
    promotionid:       string;
    name:              string;
    status:            PromotionStatus;
    statuslabel:       string;
    promotiondate:     string;
    remarks:           string;
    studentid:         string;
    studentname:       string;
    fromgradelevelid:  string;
    fromgradelevelname: string;
    togradelevelid:    string;
    togradelevelname:  string;
    fromclassid:       string;
    fromclassname:     string;
    toclassid:         string;
    toclassname:       string;
    academicyearid:    string;
    academicyearname:  string;
    createdon:         string;
}

export interface CreatePromotionRequest {
    status:            PromotionStatus;
    promotiondate?:    string;
    remarks?:          string;
    studentid:         string;
    fromgradelevelid?: string;
    togradelevelid?:   string;
    fromclassid?:      string;
    toclassid?:        string;
    academicyearid?:   string;
}

export interface PromotionFilters {
    academicyearid?: string;
    fromgradelevelid?: string;
    studentid?: string;
}

const SELECT = [
    'sms_promotionid', 'sms_name', 'sms_status', 'sms_promotiondate', 'sms_remarks',
    '_sms_student_value',
    '_sms_fromgradelevel_value', '_sms_togradelevel_value',
    '_sms_fromclass_value',      '_sms_toclass_value',
    '_sms_academicyear_value',
    'createdon',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPromotion(item: any): Promotion {
    const status = item.sms_status ?? 1;
    return {
        promotionid:        item.sms_promotionid,
        name:               item.sms_name ?? '',
        status:             status as PromotionStatus,
        statuslabel:        PROMOTION_STATUS_LABELS[status] ?? '',
        promotiondate:      item.sms_promotiondate ? item.sms_promotiondate.slice(0, 10) : '',
        remarks:            item.sms_remarks ?? '',
        studentid:          item._sms_student_value ?? '',
        studentname:        item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        fromgradelevelid:   item._sms_fromgradelevel_value ?? '',
        fromgradelevelname: item['_sms_fromgradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        togradelevelid:     item._sms_togradelevel_value ?? '',
        togradelevelname:   item['_sms_togradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        fromclassid:        item._sms_fromclass_value ?? '',
        fromclassname:      item['_sms_fromclass_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        toclassid:          item._sms_toclass_value ?? '',
        toclassname:        item['_sms_toclass_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        academicyearid:     item._sms_academicyear_value ?? '',
        academicyearname:   item['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        createdon:          item.createdon ?? '',
    };
}

export const getPromotions = async (filters?: PromotionFilters) => {
    const conditions: string[] = [];
    if (filters?.academicyearid)   conditions.push(`_sms_academicyear_value eq ${filters.academicyearid}`);
    if (filters?.fromgradelevelid) conditions.push(`_sms_fromgradelevel_value eq ${filters.fromgradelevelid}`);
    if (filters?.studentid)        conditions.push(`_sms_student_value eq ${filters.studentid}`);

    const parts: string[] = [
        `$select=${SELECT}`,
        `$orderby=createdon desc`,
        `$top=500`,
        `$count=true`,
    ];
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await dataverseClient.get<any>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (response.value ?? []).map((r: any) => mapPromotion(r));
    return { items, totalCount: (response['@odata.count'] as number) ?? items.length };
};

export const getPromotionById = async (id: string): Promise<Promotion> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapPromotion(r);
};

export const createPromotion = async (data: CreatePromotionRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:   `Promotion - ${new Date().toISOString().slice(0, 10)}`,
        sms_status: data.status,
    };
    if (data.promotiondate)    payload.sms_promotiondate                    = data.promotiondate;
    if (data.remarks)          payload.sms_remarks                          = data.remarks;
    if (data.studentid)        payload['sms_student@odata.bind']            = `/sms_students(${data.studentid})`;
    if (data.fromgradelevelid) payload['sms_fromgradelevel@odata.bind']     = `/sms_gradelevels(${data.fromgradelevelid})`;
    if (data.togradelevelid)   payload['sms_togradelevel@odata.bind']       = `/sms_gradelevels(${data.togradelevelid})`;
    if (data.fromclassid)      payload['sms_fromclass@odata.bind']          = `/sms_classes(${data.fromclassid})`;
    if (data.toclassid)        payload['sms_toclass@odata.bind']            = `/sms_classes(${data.toclassid})`;
    if (data.academicyearid)   payload['sms_academicyear@odata.bind']       = `/sms_academicyears(${data.academicyearid})`;
    return dataverseClient.post(TABLE, payload);
};

export const updatePromotion = async (id: string, data: Partial<CreatePromotionRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.status         !== undefined) payload.sms_status         = data.status;
    if (data.promotiondate  !== undefined) payload.sms_promotiondate  = data.promotiondate;
    if (data.remarks        !== undefined) payload.sms_remarks        = data.remarks;
    if (data.togradelevelid !== undefined)
        payload['sms_togradelevel@odata.bind'] = data.togradelevelid ? `/sms_gradelevels(${data.togradelevelid})` : null;
    if (data.toclassid !== undefined)
        payload['sms_toclass@odata.bind'] = data.toclassid ? `/sms_classes(${data.toclassid})` : null;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getPromotionById(id);
};

export const deletePromotion = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export interface BulkPromotionEntry {
    studentid:          string;
    status:             PromotionStatus;
    fromgradelevelid?:  string;
    togradelevelid?:    string;
    fromclassid?:       string;
    toclassid?:         string;
    academicyearid?:    string;
    remarks?:           string;
}

export const bulkPromote = async (entries: BulkPromotionEntry[]) => {
    // Capacity check: count how many students are going to each target class
    const classIncoming = new Map<string, number>();
    for (const e of entries) {
        if ((e.status === 1 || e.status === 4) && e.toclassid) {
            classIncoming.set(e.toclassid, (classIncoming.get(e.toclassid) ?? 0) + 1);
        }
    }
    for (const [classid, incoming] of classIncoming) {
        const cls = await getClassById(classid);
        const available = (cls.capacity ?? 0) - (cls.enrolledcount ?? 0);
        if (incoming > available) {
            throw new Error(
                `Class "${cls.classname}" has ${available} available seat(s) but ${incoming} student(s) are being promoted there`
            );
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const results = await Promise.allSettled(
        entries.map(async e => {
            // 1. Create promotion record
            await createPromotion({ ...e, promotiondate: today });

            // 2. Update student's class and grade level if promoted/graduated
            if (e.status === 1 || e.status === 4) {
                const studentUpdates: Record<string, string | number | undefined> = {};
                if (e.togradelevelid) studentUpdates.gradelevelid = e.togradelevelid;
                if (e.toclassid)      studentUpdates.classid      = e.toclassid;
                if (e.status === 4)   studentUpdates.studentstatus = 2; // 2 = Graduated
                if (Object.keys(studentUpdates).length) {
                    await updateStudent(e.studentid, studentUpdates);
                }
            }
        })
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    return { promoted: results.length - failed, failed };
};
