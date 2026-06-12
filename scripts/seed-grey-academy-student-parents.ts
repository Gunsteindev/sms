/**
 * seed-grey-academy-student-parents.ts
 *
 * Task #5 — seed sms_studentparents junction links for all 40 Grey Academy
 * students (audit found only 3/40 had a junction record, even though 36/40
 * already have a direct sms_students._sms_parent_value lookup).
 *
 * Steps:
 *  1. Create 3 missing parent records (James Bond, Emilia Lawson, Mikel Shawn
 *     currently have no parent at all), following the existing seed pattern
 *     (sequential phone numbers, Ghana addresses, firstname.lastname email).
 *  2. Set sms_students._sms_parent_value for those 3 students + Karen Appiah
 *     (who already has a sms_studentparents link to Esther Appiah but no
 *     direct lookup set — siblings Patricia/Adwoa Appiah both point to
 *     Esther Appiah).
 *  3. Create a sms_studentparents junction record (isprimary=true) for every
 *     student that doesn't already have one.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-student-parents.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const GREY_ACADEMY_ID = '3a5c5d93-b948-f111-bec6-7ced8d6e6816';

const KAREN_APPIAH_ID = 'fe4f35f5-843d-f111-bec6-70a8a59a431e';
const ESTHER_APPIAH_PARENT_ID = '2d4aaba8-c03f-f111-bec6-70a8a59a431e';

const NEW_PARENTS = [
    { studentId: '57893d40-d634-f111-88b4-7ced8d3bbf70', firstname: 'Robert',  lastname: 'Bond',   email: 'robert.bond@gmail.com',   phone: '0244500021', address: 'Spintex, Accra',   relationship: 1 }, // James Bond
    { studentId: '74f6928c-e034-f111-88b4-7ced8d3bbf70', firstname: 'Sandra',  lastname: 'Lawson', email: 'sandra.lawson@gmail.com', phone: '0244500022', address: 'Abelemkpe, Accra', relationship: 2 }, // Emilia Lawson
    { studentId: '77d04ebb-8332-f111-88b4-7ced8d706811', firstname: 'Patrick', lastname: 'Shawn',  email: 'patrick.shawn@gmail.com', phone: '0244500023', address: 'Kotobabi, Accra',  relationship: 1 }, // Mikel Shawn
];

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
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: Grey Academy Student-Parent links');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);
    const f = `_sms_school_value eq ${GREY_ACADEMY_ID}`;

    // ── 1. Create the 3 missing parent records ──
    console.log('1. Creating 3 missing parent records');
    const ph = {
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
            Prefer:             'return=representation',
        },
    };

    const newParentIds: Record<string, string> = {}; // studentId -> new parentId
    for (const p of NEW_PARENTS) {
        const res = await client.post('sms_parents', {
            sms_firstname:    p.firstname,
            sms_lastname:     p.lastname,
            sms_email:        p.email,
            sms_phone:        p.phone,
            sms_address:      p.address,
            sms_relationship: p.relationship,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        }, ph);
        const parentId: string = res.data.sms_parentid;
        newParentIds[p.studentId] = parentId;
        console.log(`   ✓ ${p.firstname} ${p.lastname} -> ${parentId.slice(0, 8)}…`);
    }

    // ── 2. Set _sms_parent_value direct lookup for the 4 unlinked students ──
    console.log('2. Setting direct sms_parent lookup for 4 students');
    await client.patch(`sms_students(${KAREN_APPIAH_ID})`, {
        'sms_parent@odata.bind': `/sms_parents(${ESTHER_APPIAH_PARENT_ID})`,
    });
    console.log('   ✓ Karen Appiah -> Esther Appiah');

    for (const p of NEW_PARENTS) {
        await client.patch(`sms_students(${p.studentId})`, {
            'sms_parent@odata.bind': `/sms_parents(${newParentIds[p.studentId]})`,
        });
        console.log(`   ✓ ${p.studentId.slice(0, 8)}… -> ${p.firstname} ${p.lastname}`);
    }

    // ── 3. Create junction records for every student lacking one ──
    console.log('3. Creating sms_studentparents junction records');

    const students = await getAll<{ sms_studentid: string; sms_firstname: string; sms_lastname: string; _sms_parent_value: string | null }>(
        client, `sms_students?$select=sms_studentid,sms_firstname,sms_lastname,_sms_parent_value&$filter=${f}`,
    );
    const existingLinks = await getAll<{ _sms_student_value: string }>(
        client, `sms_studentparents?$select=_sms_student_value&$filter=${f}`,
    );
    const linkedStudentIds = new Set(existingLinks.map((l) => l._sms_student_value));

    let created = 0, skipped = 0;
    for (const s of students) {
        if (linkedStudentIds.has(s.sms_studentid)) { skipped++; continue; }

        const parentId = s._sms_parent_value || newParentIds[s.sms_studentid];
        if (!parentId) {
            console.error(`   ✗ ${s.sms_firstname} ${s.sms_lastname}: no parent resolved`);
            continue;
        }

        await client.post('sms_studentparents', {
            'sms_student@odata.bind': `/sms_students(${s.sms_studentid})`,
            'sms_parent@odata.bind':  `/sms_parents(${parentId})`,
            sms_isprimary: true,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        });
        created++;
    }
    console.log(`   ${created} created, ${skipped} already linked (of ${students.length} students)`);

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
