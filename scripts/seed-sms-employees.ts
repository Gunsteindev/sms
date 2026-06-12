import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API   = `${D}/api/data/v9.2`;
const TABLE = 'sms_employees';

// Picklist values (confirmed via metadata inspection):
// sms_gender:         1=Male  2=Female
// sms_employeetype:   1=Teaching  2=Non-Teaching  3=Administrative  4=Support
// sms_employeestatus: 1=Active  2=On Leave  3=Resigned  4=Terminated

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let h: any;

async function getToken() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    h = {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMsg(e: unknown) { return (e as any).response?.data?.error?.message ?? (e as Error).message; }

interface EmployeeSeed {
    code: string;
    firstname: string;
    lastname: string;
    dob: string;
    gender: 1 | 2;
    email: string;
    phone: string;
    address: string;
    department: string;
    designation: string;
    type: 1 | 2 | 3 | 4;
    hiredate: string;
    status: 1 | 2 | 3 | 4;
    salary: number;
    bank: string;
    ecName: string;
    ecPhone: string;
}

const EMPLOYEES: EmployeeSeed[] = [
    // ── Administration ────────────────────────────────────────────────────────
    {
        code: 'EMP-001', firstname: 'Kwame',    lastname: 'Asante',
        dob: '1975-03-12T00:00:00Z', gender: 1,
        email: 'k.asante@school.edu.gh',        phone: '+233244100001',
        address: '12 Independence Ave, Accra',
        department: 'Administration', designation: 'Principal',
        type: 3, hiredate: '2010-09-01T00:00:00Z', status: 1,
        salary: 8500, bank: 'GCB-001-0001',
        ecName: 'Abena Asante', ecPhone: '+233244200001',
    },
    {
        code: 'EMP-002', firstname: 'Akosua',   lastname: 'Mensah',
        dob: '1979-07-22T00:00:00Z', gender: 2,
        email: 'a.mensah@school.edu.gh',        phone: '+233244100002',
        address: '5 Ring Road East, Accra',
        department: 'Administration', designation: 'Deputy Principal',
        type: 3, hiredate: '2012-01-15T00:00:00Z', status: 1,
        salary: 7200, bank: 'ECO-002-0002',
        ecName: 'Kofi Mensah', ecPhone: '+233244200002',
    },
    {
        code: 'EMP-003', firstname: 'Emmanuel', lastname: 'Boateng',
        dob: '1985-11-05T00:00:00Z', gender: 1,
        email: 'e.boateng@school.edu.gh',       phone: '+233244100003',
        address: '22 Cantonments Rd, Accra',
        department: 'Administration', designation: 'School Registrar',
        type: 3, hiredate: '2015-03-01T00:00:00Z', status: 1,
        salary: 4800, bank: 'SG-003-0003',
        ecName: 'Grace Boateng', ecPhone: '+233244200003',
    },
    // ── Finance ───────────────────────────────────────────────────────────────
    {
        code: 'EMP-004', firstname: 'Adwoa',    lastname: 'Owusu',
        dob: '1983-04-18T00:00:00Z', gender: 2,
        email: 'a.owusu@school.edu.gh',         phone: '+233244100004',
        address: '9 Labone Crescent, Accra',
        department: 'Finance', designation: 'Finance Officer',
        type: 3, hiredate: '2014-08-01T00:00:00Z', status: 1,
        salary: 5500, bank: 'ADB-004-0004',
        ecName: 'Yaw Owusu', ecPhone: '+233244200004',
    },
    {
        code: 'EMP-005', firstname: 'Richard',  lastname: 'Darko',
        dob: '1990-09-30T00:00:00Z', gender: 1,
        email: 'r.darko@school.edu.gh',         phone: '+233244100005',
        address: '17 Tema Motorway, Tema',
        department: 'Finance', designation: 'Accounts Assistant',
        type: 3, hiredate: '2019-02-01T00:00:00Z', status: 1,
        salary: 3200, bank: 'GCB-005-0005',
        ecName: 'Ama Darko', ecPhone: '+233244200005',
    },
    // ── Teaching — Sciences ───────────────────────────────────────────────────
    {
        code: 'EMP-006', firstname: 'Yaw',      lastname: 'Amponsah',
        dob: '1980-06-14T00:00:00Z', gender: 1,
        email: 'y.amponsah@school.edu.gh',      phone: '+233244100006',
        address: '3 McCarthy Hill, Accra',
        department: 'Sciences', designation: 'Mathematics Teacher',
        type: 1, hiredate: '2011-09-01T00:00:00Z', status: 1,
        salary: 4500, bank: 'ECO-006-0006',
        ecName: 'Efua Amponsah', ecPhone: '+233244200006',
    },
    {
        code: 'EMP-007', firstname: 'Abena',    lastname: 'Acheampong',
        dob: '1987-02-28T00:00:00Z', gender: 2,
        email: 'a.acheampong@school.edu.gh',    phone: '+233244100007',
        address: '45 East Legon, Accra',
        department: 'Sciences', designation: 'Biology Teacher',
        type: 1, hiredate: '2016-09-01T00:00:00Z', status: 1,
        salary: 4500, bank: 'SG-007-0007',
        ecName: 'Kojo Acheampong', ecPhone: '+233244200007',
    },
    {
        code: 'EMP-008', firstname: 'Samuel',   lastname: 'Frimpong',
        dob: '1984-10-10T00:00:00Z', gender: 1,
        email: 's.frimpong@school.edu.gh',      phone: '+233244100008',
        address: '8 Asylum Down, Accra',
        department: 'Sciences', designation: 'Physics Teacher',
        type: 1, hiredate: '2013-01-10T00:00:00Z', status: 2,
        salary: 4500, bank: 'GCB-008-0008',
        ecName: 'Nana Frimpong', ecPhone: '+233244200008',
    },
    {
        code: 'EMP-009', firstname: 'Maame',    lastname: 'Boadu',
        dob: '1991-05-03T00:00:00Z', gender: 2,
        email: 'm.boadu@school.edu.gh',         phone: '+233244100009',
        address: '11 Tema, Greater Accra',
        department: 'Sciences', designation: 'Chemistry Teacher',
        type: 1, hiredate: '2019-09-01T00:00:00Z', status: 1,
        salary: 4200, bank: 'ADB-009-0009',
        ecName: 'Kofi Boadu', ecPhone: '+233244200009',
    },
    // ── Teaching — Humanities ─────────────────────────────────────────────────
    {
        code: 'EMP-010', firstname: 'Ama',      lastname: 'Sarpong',
        dob: '1982-08-03T00:00:00Z', gender: 2,
        email: 'a.sarpong@school.edu.gh',       phone: '+233244100010',
        address: '28 North Ridge, Accra',
        department: 'Humanities', designation: 'English Teacher',
        type: 1, hiredate: '2012-09-01T00:00:00Z', status: 1,
        salary: 4500, bank: 'ECO-010-0010',
        ecName: 'Kweku Sarpong', ecPhone: '+233244200010',
    },
    {
        code: 'EMP-011', firstname: 'Kofi',     lastname: 'Amoah',
        dob: '1978-12-20T00:00:00Z', gender: 1,
        email: 'k.amoah@school.edu.gh',         phone: '+233244100011',
        address: '6 Airport Residential, Accra',
        department: 'Humanities', designation: 'History & Social Studies Teacher',
        type: 1, hiredate: '2009-09-01T00:00:00Z', status: 1,
        salary: 4800, bank: 'GCB-011-0011',
        ecName: 'Akua Amoah', ecPhone: '+233244200011',
    },
    {
        code: 'EMP-012', firstname: 'Fatima',   lastname: 'Seidu',
        dob: '1991-05-16T00:00:00Z', gender: 2,
        email: 'f.seidu@school.edu.gh',         phone: '+233244100012',
        address: '14 Osu, Accra',
        department: 'Humanities', designation: 'French Teacher',
        type: 1, hiredate: '2018-09-01T00:00:00Z', status: 1,
        salary: 4200, bank: 'SG-012-0012',
        ecName: 'Ibrahim Seidu', ecPhone: '+233244200012',
    },
    {
        code: 'EMP-013', firstname: 'Akwasi',   lastname: 'Poku',
        dob: '1986-03-19T00:00:00Z', gender: 1,
        email: 'a.poku@school.edu.gh',          phone: '+233244100013',
        address: '21 Adabraka, Accra',
        department: 'Humanities', designation: 'Religious & Moral Education Teacher',
        type: 1, hiredate: '2017-09-01T00:00:00Z', status: 1,
        salary: 4200, bank: 'ADB-013-0013',
        ecName: 'Akua Poku', ecPhone: '+233244200013',
    },
    // ── Teaching — ICT ────────────────────────────────────────────────────────
    {
        code: 'EMP-014', firstname: 'Daniel',   lastname: 'Tetteh',
        dob: '1989-01-07T00:00:00Z', gender: 1,
        email: 'd.tetteh@school.edu.gh',        phone: '+233244100014',
        address: '31 Madina, Accra',
        department: 'ICT', designation: 'ICT Teacher',
        type: 1, hiredate: '2017-09-01T00:00:00Z', status: 1,
        salary: 4500, bank: 'GCB-014-0014',
        ecName: 'Mercy Tetteh', ecPhone: '+233244200014',
    },
    // ── Teaching — Arts & PE ──────────────────────────────────────────────────
    {
        code: 'EMP-015', firstname: 'Felicia',  lastname: 'Appiah',
        dob: '1986-09-25T00:00:00Z', gender: 2,
        email: 'f.appiah@school.edu.gh',        phone: '+233244100015',
        address: '19 Sakumono, Accra',
        department: 'Arts', designation: 'Visual Arts Teacher',
        type: 1, hiredate: '2015-09-01T00:00:00Z', status: 1,
        salary: 4200, bank: 'ECO-015-0015',
        ecName: 'Joseph Appiah', ecPhone: '+233244200015',
    },
    {
        code: 'EMP-016', firstname: 'Isaac',    lastname: 'Quaye',
        dob: '1988-04-02T00:00:00Z', gender: 1,
        email: 'i.quaye@school.edu.gh',         phone: '+233244100016',
        address: '7 Dansoman, Accra',
        department: 'Physical Education', designation: 'Physical Education Teacher',
        type: 1, hiredate: '2016-01-05T00:00:00Z', status: 1,
        salary: 4200, bank: 'SG-016-0016',
        ecName: 'Rose Quaye', ecPhone: '+233244200016',
    },
    // ── Non-Teaching ──────────────────────────────────────────────────────────
    {
        code: 'EMP-017', firstname: 'Patience', lastname: 'Ankrah',
        dob: '1981-11-13T00:00:00Z', gender: 2,
        email: 'p.ankrah@school.edu.gh',        phone: '+233244100017',
        address: '55 Roman Ridge, Accra',
        department: 'Library', designation: 'Head Librarian',
        type: 2, hiredate: '2013-09-01T00:00:00Z', status: 1,
        salary: 3800, bank: 'ADB-017-0017',
        ecName: 'James Ankrah', ecPhone: '+233244200017',
    },
    {
        code: 'EMP-018', firstname: 'Gloria',   lastname: 'Asiedu',
        dob: '1985-06-08T00:00:00Z', gender: 2,
        email: 'g.asiedu@school.edu.gh',        phone: '+233244100018',
        address: '2 Spintex Road, Accra',
        department: 'Counselling', designation: 'School Counsellor',
        type: 2, hiredate: '2018-03-01T00:00:00Z', status: 1,
        salary: 3800, bank: 'GCB-018-0018',
        ecName: 'Eric Asiedu', ecPhone: '+233244200018',
    },
    {
        code: 'EMP-019', firstname: 'Charity',  lastname: 'Osei',
        dob: '1990-03-21T00:00:00Z', gender: 2,
        email: 'c.osei@school.edu.gh',          phone: '+233244100019',
        address: '11 Kanda, Accra',
        department: 'Health', designation: 'School Nurse',
        type: 2, hiredate: '2020-01-06T00:00:00Z', status: 1,
        salary: 3600, bank: 'ECO-019-0019',
        ecName: 'Frank Osei', ecPhone: '+233244200019',
    },
    // ── Support — Security ────────────────────────────────────────────────────
    {
        code: 'EMP-020', firstname: 'Alhaji',   lastname: 'Musah',
        dob: '1976-08-15T00:00:00Z', gender: 1,
        email: 'a.musah@school.edu.gh',         phone: '+233244100020',
        address: '33 Kotobabi, Accra',
        department: 'Security', designation: 'Head of Security',
        type: 4, hiredate: '2011-06-01T00:00:00Z', status: 1,
        salary: 2800, bank: 'SG-020-0020',
        ecName: 'Rahinatu Musah', ecPhone: '+233244200020',
    },
    {
        code: 'EMP-021', firstname: 'Benjamin', lastname: 'Larbi',
        dob: '1992-02-11T00:00:00Z', gender: 1,
        email: 'b.larbi@school.edu.gh',         phone: '+233244100021',
        address: '4 Achimota, Accra',
        department: 'Security', designation: 'Security Officer',
        type: 4, hiredate: '2021-07-01T00:00:00Z', status: 1,
        salary: 2200, bank: 'ADB-021-0021',
        ecName: 'Abigail Larbi', ecPhone: '+233244200021',
    },
    {
        code: 'EMP-022', firstname: 'Rejoice',  lastname: 'Dotse',
        dob: '1994-09-09T00:00:00Z', gender: 2,
        email: 'r.dotse@school.edu.gh',         phone: '+233244100022',
        address: '18 Nungua, Accra',
        department: 'Security', designation: 'Security Officer',
        type: 4, hiredate: '2022-05-02T00:00:00Z', status: 1,
        salary: 2200, bank: 'GCB-022-0022',
        ecName: 'Kwame Dotse', ecPhone: '+233244200022',
    },
    // ── Support — Maintenance ─────────────────────────────────────────────────
    {
        code: 'EMP-023', firstname: 'Kweku',    lastname: 'Asare',
        dob: '1983-07-04T00:00:00Z', gender: 1,
        email: 'k.asare@school.edu.gh',         phone: '+233244100023',
        address: '16 Adenta, Accra',
        department: 'Maintenance', designation: 'Facilities Manager',
        type: 4, hiredate: '2014-04-01T00:00:00Z', status: 1,
        salary: 3000, bank: 'ECO-023-0023',
        ecName: 'Adwoa Asare', ecPhone: '+233244200023',
    },
    {
        code: 'EMP-024', firstname: 'Comfort',  lastname: 'Nyarko',
        dob: '1995-10-17T00:00:00Z', gender: 2,
        email: 'c.nyarko@school.edu.gh',        phone: '+233244100024',
        address: '27 Kasoa, Central Region',
        department: 'Maintenance', designation: 'Cleaner',
        type: 4, hiredate: '2022-01-03T00:00:00Z', status: 1,
        salary: 1800, bank: 'SG-024-0024',
        ecName: 'Kwame Nyarko', ecPhone: '+233244200024',
    },
    {
        code: 'EMP-025', firstname: 'Moses',    lastname: 'Agyemang',
        dob: '1988-12-01T00:00:00Z', gender: 1,
        email: 'm.agyemang@school.edu.gh',      phone: '+233244100025',
        address: '9 Ablekuma, Accra',
        department: 'Maintenance', designation: 'Groundskeeper',
        type: 4, hiredate: '2018-06-01T00:00:00Z', status: 1,
        salary: 2000, bank: 'ADB-025-0025',
        ecName: 'Nana Agyemang', ecPhone: '+233244200025',
    },
    // ── Support — IT ──────────────────────────────────────────────────────────
    {
        code: 'EMP-026', firstname: 'Nana',     lastname: 'Barimah',
        dob: '1993-12-29T00:00:00Z', gender: 1,
        email: 'n.barimah@school.edu.gh',       phone: '+233244100026',
        address: '38 Tesano, Accra',
        department: 'ICT', designation: 'IT Technician',
        type: 4, hiredate: '2021-03-01T00:00:00Z', status: 1,
        salary: 3200, bank: 'GCB-026-0026',
        ecName: 'Esi Barimah', ecPhone: '+233244200026',
    },
    // ── Support — Transport ───────────────────────────────────────────────────
    {
        code: 'EMP-027', firstname: 'Joseph',   lastname: 'Ofori',
        dob: '1977-04-25T00:00:00Z', gender: 1,
        email: 'j.ofori@school.edu.gh',         phone: '+233244100027',
        address: '5 Kaneshie, Accra',
        department: 'Transport', designation: 'School Bus Driver',
        type: 4, hiredate: '2013-09-01T00:00:00Z', status: 1,
        salary: 2500, bank: 'ECO-027-0027',
        ecName: 'Esi Ofori', ecPhone: '+233244200027',
    },
    {
        code: 'EMP-028', firstname: 'Andrews',  lastname: 'Kumah',
        dob: '1981-06-30T00:00:00Z', gender: 1,
        email: 'a.kumah@school.edu.gh',         phone: '+233244100028',
        address: '14 Lapaz, Accra',
        department: 'Transport', designation: 'School Bus Driver',
        type: 4, hiredate: '2017-01-09T00:00:00Z', status: 1,
        salary: 2500, bank: 'SG-028-0028',
        ecName: 'Abena Kumah', ecPhone: '+233244200028',
    },
];

async function seedForSchool(schoolId: string, schoolName: string) {
    // Fetch existing codes for THIS school only to avoid duplicates
    const filter = encodeURIComponent(`_sms_school_value eq ${schoolId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ex = await axios.get<any>(`${API}/${TABLE}?$select=sms_employeecode&$filter=${filter}`, { headers: h, timeout: 20000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCodes = new Set<string>((ex.data.value ?? []).map((e: any) => e.sms_employeecode as string));

    let created = 0, skipped = 0, failed = 0;

    for (const emp of EMPLOYEES) {
        if (existingCodes.has(emp.code)) { skipped++; continue; }

        const payload: Record<string, unknown> = {
            sms_name:                  `${emp.firstname} ${emp.lastname}`,
            sms_employeecode:          emp.code,
            sms_firstname:             emp.firstname,
            sms_lastname:              emp.lastname,
            sms_dateofbirth:           emp.dob,
            sms_gender:                emp.gender,
            sms_email:                 emp.email,
            sms_phone:                 emp.phone,
            sms_address:               emp.address,
            sms_department:            emp.department,
            sms_designation:           emp.designation,
            sms_employeetype:          emp.type,
            sms_hiredate:              emp.hiredate,
            sms_employeestatus:        emp.status,
            sms_salary:                emp.salary,
            sms_bankaccount:           emp.bank,
            sms_emergencycontactname:  emp.ecName,
            sms_emergencycontactphone: emp.ecPhone,
            'sms_school@odata.bind':   `/sms_schools(${schoolId})`,
        };

        try {
            await axios.post(`${API}/${TABLE}`, payload, { headers: h, timeout: 20000 });
            created++;
        } catch (e) {
            console.log(`    ✗ ${emp.code} ${emp.firstname} ${emp.lastname} — ${errMsg(e)}`);
            failed++;
        }
    }

    const statusMark = created > 0 ? '✓' : (skipped === EMPLOYEES.length ? '–' : '✗');
    console.log(`  ${statusMark} ${schoolName.padEnd(38)} created=${created}  skipped=${skipped}  failed=${failed}`);
    return { created, skipped, failed };
}

async function main() {
    console.log('=== Seed sms_employees — All Schools ===\n');
    await getToken();
    console.log('Token OK\n');

    // Fetch all schools
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sr = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$orderby=sms_name asc`, { headers: h, timeout: 20000 });
    const schools = sr.data.value ?? [];
    if (!schools.length) { console.error('No schools found — aborting.'); process.exit(1); }
    console.log(`Seeding ${EMPLOYEES.length} employees × ${schools.length} schools:\n`);

    let totalCreated = 0, totalSkipped = 0, totalFailed = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const school of schools) {
        const result = await seedForSchool(school.sms_schoolid, school.sms_name);
        totalCreated  += result.created;
        totalSkipped  += result.skipped;
        totalFailed   += result.failed;
    }

    console.log(`\nTotal — Created: ${totalCreated}  Skipped: ${totalSkipped}  Failed: ${totalFailed}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
