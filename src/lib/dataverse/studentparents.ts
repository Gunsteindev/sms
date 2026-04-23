import { dataverseClient } from "./client";

const TABLE = 'sms_studentparents';
// Fields: sms_studentparentid, sms_isprimary
// Lookups: sms_student → _sms_student_value
//          sms_parent  → _sms_parent_value

export interface StudentParent {
    studentparentid: string;
    isprimary: boolean;
    studentid: string;
    studentname: string;
    parentid: string;
    parentname: string;
    parentemail: string;
    parentphone: string;
    relationship: number;
    createdon: string;
}

export interface LinkStudentParentRequest {
    studentid: string;
    parentid: string;
    isprimary?: boolean;
}

const SELECT = 'sms_studentparentid,sms_isprimary,_sms_student_value,_sms_parent_value,createdon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudentParent(item: any): StudentParent {
    return {
        studentparentid: item.sms_studentparentid,
        isprimary:   item.sms_isprimary   ?? false,
        studentid:   item._sms_student_value ?? '',
        studentname: item['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        parentid:    item._sms_parent_value  ?? '',
        parentname:  item['_sms_parent_value@OData.Community.Display.V1.FormattedValue']  ?? '',
        // these will be populated after expanding the parent record
        parentemail: item['sms_parent_emailaddress1'] ?? '',
        parentphone: item['sms_parent_telephone1']    ?? '',
        relationship: item['sms_parent_relationship'] ?? 3,
        createdon:   item.createdon ?? '',
    };
}

export const getStudentParents = async (studentid: string): Promise<StudentParent[]> => {
    const filter = encodeURIComponent(`_sms_student_value eq ${studentid}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}&$orderby=sms_isprimary desc`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapStudentParent(item));
};

export const getParentStudents = async (parentid: string): Promise<StudentParent[]> => {
    const filter = encodeURIComponent(`_sms_parent_value eq ${parentid}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await dataverseClient.get<any>(`${TABLE}?$select=${SELECT}&$filter=${filter}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapStudentParent(item));
};

export const linkStudentParent = async (data: LinkStudentParentRequest) => {
    const payload: Record<string, unknown> = {
        'sms_student@odata.bind': `/sms_students(${data.studentid})`,
        'sms_parent@odata.bind':  `/sms_parents(${data.parentid})`,
        sms_isprimary: data.isprimary ?? false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateStudentParent = async (id: string, data: { isprimary: boolean }) => {
    await dataverseClient.patch(`${TABLE}(${id})`, { sms_isprimary: data.isprimary });
};

export const unlinkStudentParent = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};
