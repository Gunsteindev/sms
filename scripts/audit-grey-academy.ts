/**
 * audit-grey-academy.ts
 *
 * Read-only audit of Grey Academy's data across every module:
 *   - record counts per table
 *   - null/missing-lookup counts for key relational fields
 *   - a few sample records from core academic tables
 *
 * Run: npx ts-node --skipProject scripts/audit-grey-academy.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
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

async function count(client: AxiosInstance, table: string, idField: string, filter: string): Promise<number> {
    try {
        const res = await client.get(`${table}?$select=${idField}&$filter=${encodeURIComponent(filter)}&$top=5000`);
        return res.data.value.length;
    } catch {
        return -1;
    }
}

interface TableSpec {
    table: string;
    idField: string;
    label: string;
    lookups?: string[]; // true Dataverse lookups (_sms_xxx_value) to check for null
}

const TABLES: TableSpec[] = [
    { table: 'sms_students',           idField: 'sms_studentid',           label: 'Students',           lookups: ['_sms_class_value', '_sms_gradelevel_value', '_sms_parent_value'] },
    { table: 'sms_teachers',           idField: 'sms_teacherid',           label: 'Teachers',           lookups: ['_sms_class_value'] },
    { table: 'sms_employees',          idField: 'sms_employeeid',          label: 'Employees' },
    { table: 'sms_parents',            idField: 'sms_parentid',            label: 'Parents' },
    { table: 'sms_studentparents',     idField: 'sms_studentparentid',     label: 'Student-Parent links', lookups: ['_sms_student_value', '_sms_parent_value'] },
    { table: 'sms_academicyears',      idField: 'sms_academicyearid',      label: 'Academic Years' },
    { table: 'sms_terms',              idField: 'sms_termid',              label: 'Terms',              lookups: ['_sms_academicyear_value'] },
    { table: 'sms_gradelevels',        idField: 'sms_gradelevelid',        label: 'Grade Levels' },
    { table: 'sms_classes',            idField: 'sms_classid',             label: 'Classes',            lookups: ['_sms_academicyear_value', '_sms_gradelevel_value', '_sms_teacher_value'] },
    { table: 'sms_subjects',           idField: 'sms_subjectid',           label: 'Subjects',           lookups: ['_sms_gradelevel_value', '_sms_teacher_value'] },
    { table: 'sms_departments',        idField: 'sms_departmentid',        label: 'Departments',        lookups: ['_sms_headofdepartment_value'] },
    { table: 'sms_enrollments',        idField: 'sms_enrollmentid',        label: 'Enrollments',        lookups: ['_sms_student_value', '_sms_class_value', '_sms_academicyear_value'] },
    { table: 'sms_exams',              idField: 'sms_examid',              label: 'Exams',              lookups: ['_sms_academicyear_value', '_sms_class_value', '_sms_subject_value', '_sms_term_value'] },
    { table: 'sms_examresults',        idField: 'sms_examresultid',        label: 'Exam Results',       lookups: ['_sms_exam_value', '_sms_student_value'] },
    { table: 'sms_grades',             idField: 'sms_gradeid',             label: 'Grades',             lookups: ['_sms_student_value', '_sms_subject_value', '_sms_class_value', '_sms_term_value', '_sms_academicyear_value', '_sms_teacher_value'] },
    { table: 'sms_attendances',        idField: 'sms_attendanceid',        label: 'Attendance',         lookups: ['_sms_student_value', '_sms_class_value', '_sms_subject_value'] },
    { table: 'sms_timetables',         idField: 'sms_timetableid',         label: 'Timetable',          lookups: ['_sms_class_value', '_sms_subject_value', '_sms_teacher_value'] },
    { table: 'sms_feetypes',           idField: 'sms_feetypeid',           label: 'Fee Types' },
    { table: 'sms_feestructures',      idField: 'sms_feestructureid',      label: 'Fee Structures',     lookups: ['_sms_gradelevel_value', '_sms_academicyear_value'] },
    { table: 'sms_fees',               idField: 'sms_feeid',               label: 'Fee Invoices',       lookups: ['_sms_student_value', '_sms_feestructure_value', '_sms_academicyear_value', '_sms_term_value'] },
    { table: 'sms_feepayments',        idField: 'sms_feepaymentid',        label: 'Fee Payments',       lookups: ['_sms_student_value', '_sms_fee_value'] },
    { table: 'sms_scholarships',       idField: 'sms_scholarshipid',       label: 'Scholarships',       lookups: ['_sms_student_value', '_sms_academicyear_value'] },
    { table: 'sms_promotions',         idField: 'sms_promotionid',         label: 'Promotions',         lookups: ['_sms_student_value', '_sms_fromgradelevel_value', '_sms_togradelevel_value', '_sms_fromclass_value', '_sms_toclass_value', '_sms_academicyear_value'] },
    { table: 'sms_librarybooks',       idField: 'sms_librarybookid',       label: 'Library Books' },
    { table: 'sms_libraryloans',       idField: 'sms_libraryloanid',       label: 'Library Loans',      lookups: ['_sms_librarybook_value', '_sms_student_value'] },
    { table: 'sms_medical',            idField: 'sms_medicalid',           label: 'Medical Records',    lookups: ['_sms_student_value'] },
    { table: 'sms_disciplinary',       idField: 'sms_disciplinaryid',      label: 'Disciplinary',       lookups: ['_sms_student_value', '_sms_reportedby_value'] },
    { table: 'sms_activities',         idField: 'sms_activityid',          label: 'Activities' },
    { table: 'sms_activityparticipants', idField: 'sms_activityparticipantid', label: 'Activity Participants', lookups: ['_sms_student_value'] },
    { table: 'sms_announcements',      idField: 'sms_announcementid',      label: 'Announcements' },
    { table: 'sms_staffleaves',        idField: 'sms_staffleaveid',        label: 'Staff Leave' },
    { table: 'sms_inventoryitems',     idField: 'sms_inventoryitemid',     label: 'Inventory Items' },
    { table: 'sms_inventorymovements', idField: 'sms_inventorymovementid', label: 'Inventory Movements' },
    { table: 'sms_vehicles',           idField: 'sms_vehicleid',           label: 'Vehicles' },
    { table: 'sms_vehiclemaintenances', idField: 'sms_vehiclemaintenanceid', label: 'Vehicle Maintenance', lookups: ['_sms_vehicle_value'] },
    { table: 'sms_routeassignments',   idField: 'sms_routeassignmentid',   label: 'Route Assignments',  lookups: ['_sms_student_value', '_sms_vehicle_value'] },
    { table: 'sms_expenditures',       idField: 'sms_expenditureid',       label: 'Procurement' },
    { table: 'sms_kitchenmenus',       idField: 'sms_kitchenmenuid',       label: 'Kitchen Menus' },
    { table: 'sms_mealorders',         idField: 'sms_mealorderid',         label: 'Meal Orders',        lookups: ['_sms_student_value'] },
    { table: 'sms_poolsessions',       idField: 'sms_poolsessionid',       label: 'Pool Sessions' },
    { table: 'sms_poolrentals',        idField: 'sms_poolrentalid',        label: 'Pool Rentals' },
    { table: 'sms_pooltransactions',   idField: 'sms_pooltransactionid',   label: 'Pool Transactions' },
    { table: 'sms_users',              idField: 'sms_userid',              label: 'Users' },
];

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars'); process.exit(1); }

    const token  = await getToken();
    const client = makeClient(token);

    console.log(`Auditing Grey Academy (${GREY_ACADEMY_ID})\n`);
    console.log('Table                       | Count | Missing lookups');
    console.log('-'.repeat(80));

    for (const t of TABLES) {
        const schoolFilter = `_sms_school_value eq ${GREY_ACADEMY_ID}`;
        const total = await count(client, t.table, t.idField, schoolFilter);

        let missingStr = '';
        if (t.lookups && total > 0) {
            const missing: string[] = [];
            for (const lk of t.lookups) {
                const n = await count(client, t.table, t.idField, `${schoolFilter} and ${lk} eq null`);
                if (n > 0) missing.push(`${lk.replace('_sms_', '').replace('_value', '')}=${n}`);
            }
            missingStr = missing.join(', ');
        }

        const countStr = total === -1 ? 'ERR' : String(total);
        console.log(`${t.label.padEnd(28)} | ${countStr.padStart(5)} | ${missingStr}`);
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
