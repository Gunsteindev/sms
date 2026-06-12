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

const SELECT = 'sms_employeeid,sms_employeecode,sms_firstname,sms_lastname,sms_dateofbirth,sms_gender,sms_email,sms_phone,sms_address,sms_department,sms_designation,sms_employeetype,sms_hiredate,sms_employeestatus,sms_salary,sms_bankaccount,sms_emergencycontactname,sms_emergencycontactphone,createdon';

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
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
}

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.log(`  ✗ ${msg}`); }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMsg(e: unknown) { return (e as any).response?.data?.error?.message ?? (e as Error).message; }

async function main() {
    console.log('Getting Azure AD token…');
    await getToken();
    console.log('Token OK\n');

    // ── 0. Fetch a school ─────────────────────────────────────────────────────
    console.log('0. Fetch a school');
    let schoolId: string | null = null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        const s = r.data.value?.[0];
        if (s) { schoolId = s.sms_schoolid; pass(`School: "${s.sms_name}"  id=${schoolId}`); }
        else   { fail('No schools found'); }
    } catch (e) { fail(`Schools: ${errMsg(e)}`); }

    // ── 1. List existing employees ────────────────────────────────────────────
    console.log('\n1. List employees (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=${SELECT}&$top=5&$orderby=sms_firstname asc`,
            { headers: h, timeout: 20000 }
        );
        const rows = r.data.value ?? [];
        pass(`Table reachable — ${rows.length} record(s) returned`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((e: any) => {
            const type   = e['sms_employeetype@OData.Community.Display.V1.FormattedValue']   ?? e.sms_employeetype   ?? '—';
            const status = e['sms_employeestatus@OData.Community.Display.V1.FormattedValue'] ?? e.sms_employeestatus ?? '—';
            const gender = e['sms_gender@OData.Community.Display.V1.FormattedValue']         ?? e.sms_gender         ?? '—';
            console.log(`     "${e.sms_firstname} ${e.sms_lastname}"  code="${e.sms_employeecode}"  dept="${e.sms_department}"  type="${type}"  status="${status}"  gender="${gender}"`);
        });
    } catch (e) { fail(`List failed: ${errMsg(e)}`); return; }

    if (!schoolId) {
        console.log('\nNo school found — skipping write tests.');
        return;
    }

    // ── 2. Create a test employee ─────────────────────────────────────────────
    console.log('\n2. Create test employee');
    let createdId: string | null = null;
    try {
        const payload: Record<string, unknown> = {
            sms_employeecode:          'EMP-TEST-001',
            sms_firstname:             'Test',
            sms_lastname:              'Employee',
            sms_dateofbirth:           '1990-05-15T00:00:00Z',
            sms_gender:                1,
            sms_email:                 'test.employee@school.test',
            sms_phone:                 '+1234567890',
            sms_address:               '123 Test Street',
            sms_department:            'Administration',
            sms_designation:           'Test Officer',
            sms_employeetype:          1,
            sms_hiredate:              '2024-01-15T00:00:00Z',
            sms_employeestatus:        1,
            sms_salary:                3500.00,
            sms_bankaccount:           'BANK-TEST-001',
            sms_emergencycontactname:  'Emergency Contact',
            sms_emergencycontactphone: '+0987654321',
            'sms_school@odata.bind':   `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${TABLE}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = r.data?.sms_employeeid;
        const type   = r.data?.['sms_employeetype@OData.Community.Display.V1.FormattedValue']   ?? r.data?.sms_employeetype;
        const status = r.data?.['sms_employeestatus@OData.Community.Display.V1.FormattedValue'] ?? r.data?.sms_employeestatus;
        pass(`Created  id=${createdId}`);
        console.log(`     name="${r.data?.sms_firstname} ${r.data?.sms_lastname}"  dept="${r.data?.sms_department}"  type="${type}"  status="${status}"  salary=${r.data?.sms_salary}`);
    } catch (e) { fail(`Create failed: ${errMsg(e)}`); }

    if (!createdId) { console.log('\nSkipping read/update/filter/delete — create failed.'); return; }

    // ── 3. Read by ID ─────────────────────────────────────────────────────────
    console.log('\n3. Read by ID');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=${SELECT}`,
            { headers: h, timeout: 20000 }
        );
        const status = r.data['sms_employeestatus@OData.Community.Display.V1.FormattedValue'] ?? r.data.sms_employeestatus ?? '—';
        pass('Read OK');
        console.log(`     code="${r.data.sms_employeecode}"  email="${r.data.sms_email}"  phone="${r.data.sms_phone}"  emergency="${r.data.sms_emergencycontactname}"  status="${status}"`);
    } catch (e) { fail(`Read failed: ${errMsg(e)}`); }

    // ── 4. Update designation + status ────────────────────────────────────────
    console.log('\n4. Update designation and set On Leave');
    try {
        await axios.patch(
            `${API}/${TABLE}(${createdId})`,
            { sms_designation: 'Senior Test Officer', sms_employeestatus: 2, sms_salary: 4000.00 },
            { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 }
        );
        pass('PATCH OK');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=sms_designation,sms_employeestatus,sms_salary`,
            { headers: h, timeout: 20000 }
        );
        const status = r.data['sms_employeestatus@OData.Community.Display.V1.FormattedValue'] ?? r.data.sms_employeestatus;
        console.log(`     designation="${r.data.sms_designation}"  status="${status}"  salary=${r.data.sms_salary}  (expected "Senior Test Officer", On Leave, 4000)`);
    } catch (e) { fail(`Update failed: ${errMsg(e)}`); }

    // ── 5. Filter by department ───────────────────────────────────────────────
    console.log('\n5. Filter by department');
    try {
        const filter = encodeURIComponent(`sms_department eq 'Administration'`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_employeeid,sms_firstname,sms_lastname&$filter=${filter}&$top=20`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter by department returned ${r.data.value?.length ?? 0} row(s)`);
    } catch (e) { fail(`Filter failed: ${errMsg(e)}`); }

    // ── 6. Filter by status ───────────────────────────────────────────────────
    console.log('\n6. Filter by status (Active=1)');
    try {
        const filter = encodeURIComponent(`sms_employeestatus eq 1`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_employeeid,sms_employeestatus&$filter=${filter}&$top=20`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter by status=1 returned ${r.data.value?.length ?? 0} row(s)`);
    } catch (e) { fail(`Status filter failed: ${errMsg(e)}`); }

    // ── 7. Stats query ($count) ───────────────────────────────────────────────
    console.log('\n7. Stats query ($count=true)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_employeeid,sms_employeestatus&$count=true`,
            { headers: h, timeout: 20000 }
        );
        pass(`Total count: ${r.data['@odata.count'] ?? r.data.value?.length}`);
    } catch (e) { fail(`Stats query failed: ${errMsg(e)}`); }

    // ── 8. Delete test record ─────────────────────────────────────────────────
    console.log('\n8. Delete test employee');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass(`Deleted ${createdId}`);
    } catch (e) { fail(`Delete failed: ${errMsg(e)}`); }

    console.log('\nAll tests done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
