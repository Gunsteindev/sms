import { dataverseClient, type DvList } from "./client";

const TABLE = 'sms_employees';
// Fields: sms_employeeid, sms_employeecode, sms_firstname, sms_lastname,
// sms_dateofbirth, sms_gender, sms_email, sms_phone, sms_address,
// sms_department, sms_designation, sms_employeetype, sms_hiredate, sms_employeestatus,
// sms_salary, sms_bankaccount, sms_emergencycontactname, sms_emergencycontactphone

export interface Employee {
    employeeid: string;
    employeecode: string;
    firstname: string;
    lastname: string;
    dateofbirth: string;
    gender: number;
    emailaddress1: string;
    telephone1: string;
    address1_line1: string;
    department: string;
    designation: string;
    employeetype: number; // 1=Teaching, 2=Non-Teaching, 3=Administrative, 4=Support
    hiredate: string;
    statuscode: number; // 1=Active, 2=On Leave, 3=Resigned, 4=Terminated
    salary?: number;
    bankaccount?: string;
    emergencycontactname: string;
    emergencycontactphone: string;
    createdon: string;
    modifiedon: string;
}

export interface CreateEmployeeRequest {
    employeecode: string;
    firstname: string;
    lastname: string;
    dateofbirth: string;
    gender: number;
    emailaddress1: string;
    telephone1?: string;
    address1_line1?: string;
    department: string;
    designation: string;
    employeetype: number;
    hiredate: string;
    statuscode?: number;
    salary?: number;
    bankaccount?: string;
    emergencycontactname: string;
    emergencycontactphone: string;
}

const SELECT = 'sms_employeeid,sms_employeecode,sms_firstname,sms_lastname,sms_dateofbirth,sms_gender,sms_email,sms_phone,sms_address,sms_department,sms_designation,sms_employeetype,sms_hiredate,sms_employeestatus,sms_salary,sms_bankaccount,sms_emergencycontactname,sms_emergencycontactphone,createdon,modifiedon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmployee(item: any): Employee {
    return {
        employeeid:           item.sms_employeeid,
        employeecode:         item.sms_employeecode         ?? '',
        firstname:            item.sms_firstname            ?? '',
        lastname:             item.sms_lastname             ?? '',
        dateofbirth:          item.sms_dateofbirth          ?? '',
        gender:               item.sms_gender               ?? 1,
        emailaddress1:        item.sms_email                ?? '',
        telephone1:           item.sms_phone                ?? '',
        address1_line1:       item.sms_address              ?? '',
        department:           item.sms_department           ?? '',
        designation:          item.sms_designation          ?? '',
        employeetype:         item.sms_employeetype         ?? 1,
        hiredate:             item.sms_hiredate             ?? '',
        statuscode:           item.sms_employeestatus       ?? 1,
        salary:               item.sms_salary               ?? undefined,
        bankaccount:          item.sms_bankaccount          ?? undefined,
        emergencycontactname: item.sms_emergencycontactname  ?? '',
        emergencycontactphone: item.sms_emergencycontactphone ?? '',
        createdon:            item.createdon                ?? '',
        modifiedon:           item.modifiedon               ?? '',
    };
}

export const getEmployees = async (department?: string) => {
    const parts = [`$select=${SELECT}`, `$orderby=sms_firstname asc`];
    const conditions: string[] = [];
    if (department) conditions.push(`sms_department eq '${department}'`);
    if (conditions.length) parts.push(`$filter=${encodeURIComponent(conditions.join(' and '))}`);
    const r = await dataverseClient.get<DvList>(`${TABLE}?${parts.join('&')}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.value ?? []).map((item: any) => mapEmployee(item));
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
    const r = await dataverseClient.get<DvList>(`${TABLE}(${id})?$select=${SELECT}`);
    return mapEmployee(r);
};

export const createEmployee = async (data: CreateEmployeeRequest) => {
    const payload: Record<string, unknown> = {
        sms_name:                  `${data.firstname} ${data.lastname}`.trim(),
        sms_employeecode:          data.employeecode,
        sms_firstname:             data.firstname,
        sms_lastname:              data.lastname,
        sms_dateofbirth:           data.dateofbirth,
        sms_gender:                data.gender,
        sms_email:                 data.emailaddress1,
        sms_department:            data.department,
        sms_designation:           data.designation,
        sms_employeetype:          data.employeetype,
        sms_hiredate:              data.hiredate,
        sms_emergencycontactname:  data.emergencycontactname,
        sms_emergencycontactphone: data.emergencycontactphone,
    };
    if (data.telephone1)             payload.sms_phone           = data.telephone1;
    if (data.address1_line1)         payload.sms_address         = data.address1_line1;
    if (data.statuscode !== undefined) payload.sms_employeestatus = data.statuscode;
    if (data.salary !== undefined)   payload.sms_salary          = data.salary;
    if (data.bankaccount)            payload.sms_bankaccount     = data.bankaccount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dataverseClient.post<any>(TABLE, payload);
};

export const updateEmployee = async (id: string, data: Partial<CreateEmployeeRequest>) => {
    const payload: Record<string, unknown> = {};
    if (data.employeecode    !== undefined) payload.sms_employeecode    = data.employeecode;
    if (data.firstname       !== undefined) payload.sms_firstname       = data.firstname;
    if (data.lastname        !== undefined) payload.sms_lastname        = data.lastname;
    if (data.firstname !== undefined || data.lastname !== undefined) {
        const existing = await getEmployeeById(id);
        payload.sms_name = `${data.firstname ?? existing.firstname} ${data.lastname ?? existing.lastname}`.trim();
    }
    if (data.dateofbirth     !== undefined) payload.sms_dateofbirth     = data.dateofbirth;
    if (data.gender          !== undefined) payload.sms_gender          = data.gender;
    if (data.emailaddress1   !== undefined) payload.sms_email           = data.emailaddress1;
    if (data.telephone1      !== undefined) payload.sms_phone           = data.telephone1;
    if (data.address1_line1  !== undefined) payload.sms_address         = data.address1_line1;
    if (data.department      !== undefined) payload.sms_department      = data.department;
    if (data.designation     !== undefined) payload.sms_designation     = data.designation;
    if (data.employeetype    !== undefined) payload.sms_employeetype    = data.employeetype;
    if (data.hiredate        !== undefined) payload.sms_hiredate        = data.hiredate;
    if (data.statuscode      !== undefined) payload.sms_employeestatus  = data.statuscode;
    if (data.salary          !== undefined) payload.sms_salary          = data.salary;
    if (data.bankaccount     !== undefined) payload.sms_bankaccount     = data.bankaccount;
    if (data.emergencycontactname  !== undefined) payload.sms_emergencycontactname  = data.emergencycontactname;
    if (data.emergencycontactphone !== undefined) payload.sms_emergencycontactphone = data.emergencycontactphone;
    await dataverseClient.patch(`${TABLE}(${id})`, payload);
    return getEmployeeById(id);
};

export const deleteEmployee = async (id: string): Promise<void> => {
    await dataverseClient.delete(`${TABLE}(${id})`);
};

export const getEmployeeStats = async () => {
    const r = await dataverseClient.get<DvList>(`${TABLE}?$select=sms_employeeid,sms_employeestatus&$count=true`);
    const employees = r.value ?? [];
    return {
        total:      r['@odata.count'] ?? employees.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        active:     employees.filter((e: any) => e.sms_employeestatus === 1).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onLeave:    employees.filter((e: any) => e.sms_employeestatus === 2).length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resigned:   employees.filter((e: any) => e.sms_employeestatus === 3).length,
    };
};
