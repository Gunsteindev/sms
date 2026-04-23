/**
 * test-attendance.ts
 * Inspect sms_attendances: list fields, fetch sample records with annotations,
 * and test CRUD operations.
 * Run: npx tsx scripts/test-attendance.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios, { AxiosInstance } from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;
const API_BASE      = `${DATAVERSE_URL}/api/data/v9.2`;

async function buildClient(): Promise<AxiosInstance> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );
    return axios.create({
        baseURL: API_BASE,
        headers: {
            Authorization: `Bearer ${res.data.access_token}`,
            Accept: 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json',
            'Prefer': 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
        },
        timeout: 30000,
    });
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Attendance API Test');
    console.log('══════════════════════════════════════════\n');

    const api = await buildClient();
    console.log('✓ Token acquired\n');

    // ── 1. Fetch all custom attributes ──────────────────────────────────────
    console.log('── Custom attributes on sms_attendance ──');
    try {
        const meta = await api.get(
            `/EntityDefinitions(LogicalName='sms_attendance')/Attributes?$filter=IsCustomAttribute eq true&$select=LogicalName,AttributeType,DisplayName`
        );
        for (const attr of meta.data.value) {
            const display = attr.DisplayName?.UserLocalizedLabel?.Label ?? '';
            console.log(`  ${attr.LogicalName.padEnd(45)} ${attr.AttributeType.padEnd(15)} ${display}`);
        }
    } catch (e: any) {
        console.error('  Failed to fetch metadata:', e.response?.data?.error?.message ?? e.message);
    }

    // ── 2. Fetch sample records (no $select) ────────────────────────────────
    console.log('\n── Sample records (top 3, all fields) ───');
    try {
        const res = await api.get('/sms_attendances?$top=3&$orderby=createdon desc');
        const records = res.data.value ?? [];
        if (!records.length) {
            console.log('  (no records found — table is empty)');
        } else {
            records.forEach((r: any, i: number) => {
                console.log(`\n  Record ${i + 1}:`);
                Object.entries(r).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && String(v).trim() !== '') {
                        console.log(`    ${k.padEnd(60)} = ${String(v).slice(0, 80)}`);
                    }
                });
            });
        }
    } catch (e: any) {
        console.error('  Failed to fetch records:', e.response?.data?.error?.message ?? e.message);
    }

    // ── 3. Fetch with targeted $select ──────────────────────────────────────
    console.log('\n── Targeted SELECT (our current query) ──');
    const SELECT = 'sms_attendanceid,sms_name,sms_date,sms_attendancestatus,sms_checkintime,sms_remarks,_sms_student_value,_sms_classsubject_value,createdon';
    try {
        const res = await api.get(`/sms_attendances?$select=${SELECT}&$top=5&$orderby=createdon desc`);
        const records = res.data.value ?? [];
        console.log(`  Returned ${records.length} record(s)`);
        records.forEach((r: any, i: number) => {
            console.log(`\n  Row ${i + 1}:`);
            console.log(`    attendanceid : ${r.sms_attendanceid}`);
            console.log(`    date         : ${r.sms_date}`);
            console.log(`    status       : ${r.sms_attendancestatus}`);
            console.log(`    studentname  : ${r.sms_studentname}`);
            console.log(`    student_id   : ${r._sms_student_value}`);
            console.log(`    student_annot: ${r['_sms_student_value@OData.Community.Display.V1.FormattedValue']}`);
            console.log(`    subjectname  : ${r.sms_classsubjectname}`);
            console.log(`    checkintime  : ${r.sms_checkintime}`);
        });
    } catch (e: any) {
        console.error('  Failed:', e.response?.data?.error?.message ?? e.message);
        // If a field doesn't exist, try without it
        if (e.response?.data?.error?.message?.includes('Could not find')) {
            console.log('\n  ⚠ One of the selected fields does not exist. Fetching without $select to see all fields:');
            const res2 = await api.get('/sms_attendances?$top=1');
            const r = res2.data.value?.[0];
            if (r) console.log('  Fields available:', Object.keys(r).filter(k => !k.startsWith('@')).join(', '));
        }
    }

    // ── 4. Test date filter ──────────────────────────────────────────────────
    const testDate = new Date().toISOString().split('T')[0];
    console.log(`\n── Date filter test (sms_date eq ${testDate}) ──`);
    try {
        const res = await api.get(`/sms_attendances?$select=sms_attendanceid,sms_date&$filter=${encodeURIComponent(`sms_date eq ${testDate}`)}&$top=5`);
        console.log(`  Returned ${res.data.value?.length ?? 0} record(s) for today`);
    } catch (e: any) {
        // Try with quotes (some orgs use string date fields)
        console.error('  Filter without quotes failed:', e.response?.data?.error?.message ?? e.message);
        try {
            const res2 = await api.get(`/sms_attendances?$select=sms_attendanceid,sms_date&$filter=${encodeURIComponent(`sms_date eq '${testDate}'`)}&$top=5`);
            console.log(`  With quotes: ${res2.data.value?.length ?? 0} record(s) — use quoted date strings`);
        } catch (e2: any) {
            console.error('  Filter with quotes also failed:', e2.response?.data?.error?.message ?? e2.message);
        }
    }

    // ── 5. Test fetching a student to get a valid GUID for CRUD ─────────────
    console.log('\n── Fetch a real student ID for CRUD test ──');
    let studentId = '';
    try {
        const res = await api.get('/sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$top=1');
        const s = res.data.value?.[0];
        if (s) {
            studentId = s.sms_studentid;
            console.log(`  Using student: ${s.sms_firstname} ${s.sms_lastname} (${studentId})`);
        } else {
            console.log('  No students found — skipping CRUD test');
        }
    } catch (e: any) {
        console.error('  Failed to fetch student:', e.response?.data?.error?.message ?? e.message);
    }

    // ── 6. CRUD test ────────────────────────────────────────────────────────
    if (studentId) {
        console.log('\n── CRUD test ─────────────────────────────');
        let createdId = '';
        try {
            const payload: any = {
                'sms_student@odata.bind': `/sms_students(${studentId})`,
                sms_date: new Date().toISOString().split('T')[0],
                sms_attendancestatus: 1,
            };
            const createRes = await api.post('/sms_attendances', payload, { headers: { Prefer: 'return=representation' } });
            createdId = createRes.data.sms_attendanceid;
            console.log(`  ✓ Created — id: ${createdId}`);
        } catch (e: any) {
            // Try with date quoted
            try {
                const payload: any = {
                    'sms_student@odata.bind': `/sms_students(${studentId})`,
                    sms_date: `${new Date().toISOString().split('T')[0]}`,
                    sms_attendancestatus: 1,
                };
                const createRes = await api.post('/sms_attendances', payload, { headers: { Prefer: 'return=representation' } });
                createdId = createRes.data.sms_attendanceid;
                console.log(`  ✓ Created (alt) — id: ${createdId}`);
            } catch (e2: any) {
                console.error('  ✗ Create failed:', e2.response?.data?.error?.message ?? e2.message);
            }
        }

        if (createdId) {
            // READ back
            try {
                const r = await api.get(`/sms_attendances(${createdId})?$select=${SELECT}`);
                console.log(`  ✓ Read back — date: ${r.data.sms_date}, status: ${r.data.sms_attendancestatus}, student: ${r.data.sms_studentname}`);
            } catch (e: any) {
                console.error('  ✗ Read failed:', e.response?.data?.error?.message ?? e.message);
            }

            // UPDATE
            try {
                await api.patch(`/sms_attendances(${createdId})`, { sms_attendancestatus: 1, sms_remarks: 'Test remark' });
                console.log('  ✓ Updated status to Absent');
            } catch (e: any) {
                console.error('  ✗ Update failed:', e.response?.data?.error?.message ?? e.message);
            }

            // DELETE
            try {
                await api.delete(`/sms_attendances(${createdId})`);
                console.log('  ✓ Deleted test record');
            } catch (e: any) {
                console.error('  ✗ Delete failed:', e.response?.data?.error?.message ?? e.message);
            }
        }
    }

    console.log('\n══════════════════════════════════════════\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
