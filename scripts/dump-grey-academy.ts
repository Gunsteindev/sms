/**
 * dump-grey-academy.ts
 *
 * Read-only dump of Grey Academy's core reference data to a JSON file
 * (scripts/.grey-academy-data.json) for use while building the
 * relational-fix and seed scripts. Not committed — delete when done.
 *
 * Run: npx ts-node --skipProject scripts/dump-grey-academy.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
import { writeFileSync } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const GREY_ACADEMY_ID = '3a5c5d93-b948-f111-bec6-7ced8d6e6816';

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    )).data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        timeout: 30_000,
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
        },
    });
}

async function getAll<T>(client: AxiosInstance, url: string): Promise<T[]> {
    const rows: T[] = [];
    let next: string | undefined = url;
    while (next) {
        const res: { data: { value: T[]; '@odata.nextLink'?: string } } = await client.get(next);
        rows.push(...res.data.value);
        next = res.data['@odata.nextLink'];
    }
    return rows;
}

async function main() {
    const token  = await getToken();
    const client = makeClient(token);
    const f = `_sms_school_value eq ${GREY_ACADEMY_ID}`;

    const [
        academicyears, terms, gradelevels, classes, subjects, teachers,
        students, parents, enrollments, exams, feestructures, feeinvoices,
        scholarships, activities, librarybooks, libraryloans, vehicles,
        inventoryitems, employees, departments,
    ] = await Promise.all([
        getAll(client, `sms_academicyears?$select=sms_academicyearid,sms_name,sms_startdate,sms_enddate,sms_iscurrent&$filter=${f}`),
        getAll(client, `sms_terms?$select=sms_termid,sms_name,sms_startdate,sms_enddate&$filter=${f}`),
        getAll(client, `sms_gradelevels?$select=sms_gradelevelid,sms_name,sms_ordernumber&$filter=${f}`),
        getAll(client, `sms_classes?$select=sms_classid,sms_name,sms_capacity,_sms_academicyear_value,_sms_gradelevel_value,_sms_teacher_value&$filter=${f}`),
        getAll(client, `sms_subjects?$select=sms_subjectid,sms_name,sms_code,_sms_gradelevel_value,_sms_teacher_value&$filter=${f}`),
        getAll(client, `sms_teachers?$select=sms_teacherid,sms_firstname,sms_lastname,_sms_class_value&$filter=${f}`),
        getAll(client, `sms_students?$select=sms_studentid,sms_firstname,sms_lastname,_sms_class_value,_sms_gradelevel_value,_sms_parent_value&$filter=${f}`),
        getAll(client, `sms_parents?$select=sms_parentid,sms_firstname,sms_lastname&$filter=${f}`),
        getAll(client, `sms_enrollments?$select=sms_enrollmentid,sms_name,sms_rollnumber,sms_enrollmentdate,sms_enrollmentstatus,_sms_student_value,_sms_class_value,_sms_academicyear_value&$filter=${f}`),
        getAll(client, `sms_exams?$select=sms_examid,sms_name,sms_examtype,sms_startdate,sms_enddate,sms_totalmarks,sms_passmarks,_sms_academicyear_value,_sms_class_value,_sms_subject_value,_sms_term_value&$filter=${f}`),
        getAll(client, `sms_feestructures?$select=sms_feestructureid,sms_name,sms_amount,sms_duedate,_sms_gradelevel_value,_sms_academicyear_value&$filter=${f}`),
        getAll(client, `sms_fees?$select=sms_feeid,sms_name,sms_amount,sms_duedate,sms_feestatus,_sms_student_value,_sms_feestructure_value,_sms_academicyear_value,_sms_term_value&$filter=${f}`),
        getAll(client, `sms_scholarships?$select=sms_scholarshipid,sms_name,sms_type,sms_amount,sms_percentage,sms_startdate,sms_enddate,_sms_student_value,_sms_academicyear_value&$filter=${f}`),
        getAll(client, `sms_activities?$select=sms_activityid,sms_name,sms_category&$filter=${f}`),
        getAll(client, `sms_librarybooks?$select=sms_librarybookid,sms_name,sms_totalcopies,sms_availablecopies&$filter=${f}`),
        getAll(client, `sms_libraryloans?$select=sms_libraryloanid,sms_name,_sms_librarybook_value,_sms_student_value,_sms_teacher_value,sms_borrowertypecode,sms_loanstatus&$filter=${f}`),
        getAll(client, `sms_vehicles?$select=sms_vehicleid,sms_name,sms_plate,sms_vehicletype,sms_capacity,sms_status&$filter=${f}`),
        getAll(client, `sms_inventoryitems?$select=sms_inventoryitemid,sms_name,sms_quantity&$filter=${f}`),
        getAll(client, `sms_employees?$select=sms_employeeid,sms_firstname,sms_lastname,sms_designation,sms_department&$filter=${f}`),
        getAll(client, `sms_departments?$select=sms_departmentid,sms_name&$filter=${f}`),
    ]);

    const data = {
        schoolId: GREY_ACADEMY_ID,
        academicyears, terms, gradelevels, classes, subjects, teachers,
        students, parents, enrollments, exams, feestructures, feeinvoices,
        scholarships, activities, librarybooks, libraryloans, vehicles,
        inventoryitems, employees, departments,
    };

    writeFileSync(resolve(process.cwd(), 'scripts/.grey-academy-data.json'), JSON.stringify(data, null, 2));

    for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v)) console.log(`${k}: ${v.length}`);
    }
    console.log('\nWritten to scripts/.grey-academy-data.json');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
