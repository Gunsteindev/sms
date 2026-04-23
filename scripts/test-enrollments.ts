/**
 * test-enrollments.ts — discovers sms_enrollments fields, validates SELECT, full CRUD test.
 * Run: npx ts-node --skip-project scripts/test-enrollments.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_enrollments';

const APP_SELECT = 'sms_enrollmentid,sms_name,sms_rollnumber,sms_enrollmentdate,sms_enrollmentstatus,_sms_student_value,_sms_class_value,_sms_academicyear_value,createdon,modifiedon';

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Enrollments API Test');
    console.log('══════════════════════════════════════════\n');

    const token = await getToken();
    console.log('✓ Token acquired\n');
    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // ── 1. Raw field discovery ────────────────────────────────────────────────
    console.log('① Raw record (no $select) — field discovery…');
    try {
        const res = await axios.get(`${API}/${TABLE}?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) { console.log('  ⚠ Table is empty\n'); }
        else {
            Object.keys(rows[0]).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0,80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            console.log();
        }
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message));
    }

    // ── 2. App SELECT ─────────────────────────────────────────────────────────
    console.log('② App SELECT query…');
    try {
        const res = await axios.get(`${API}/${TABLE}?$select=${APP_SELECT}&$orderby=sms_name asc&$top=10`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ ${rows.length} record(s)\n`);
        rows.forEach((r, i) => {
            console.log(`  [${i+1}] ${r.sms_name ?? '?'}`);
            console.log(`      ID:            ${r.sms_enrollmentid}`);
            console.log(`      Roll #:        ${r.sms_rollnumber ?? '—'}`);
            console.log(`      Date:          ${r.sms_enrollmentdate ?? '—'}`);
            console.log(`      Status:        ${r.sms_enrollmentstatus ?? '—'} (${r['sms_enrollmentstatus@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      Student:       ${r['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Class:         ${r['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Academic Year: ${r['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2), '\n');
    }

    // ── 3. Fetch dependencies for CRUD test ───────────────────────────────────
    console.log('③ Fetching students, classes, academic years for CRUD test…');
    let students: any[] = [], classes: any[] = [], years: any[] = [];
    try {
        students = (await axios.get(`${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$top=3`, { headers: h, timeout: 20000 })).data.value ?? [];
        classes  = (await axios.get(`${API}/sms_classes?$select=sms_classid,sms_name&$top=3`, { headers: h, timeout: 20000 })).data.value ?? [];
        years    = (await axios.get(`${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$top=3`, { headers: h, timeout: 20000 })).data.value ?? [];
        console.log(`  Students: ${students.map((s:any) => `${s.sms_firstname} ${s.sms_lastname}`).join(', ')}`);
        console.log(`  Classes:  ${classes.map((c:any) => c.sms_name).join(', ')}`);
        console.log(`  Years:    ${years.map((y:any) => y.sms_name).join(', ')}\n`);
    } catch (err: any) {
        console.error('  ✗ Could not fetch dependencies:', err.response?.data?.error?.message ?? err.message, '\n');
    }

    // ── 4. CRUD test ──────────────────────────────────────────────────────────
    if (students.length && classes.length && years.length) {
        console.log('④ CRUD test…');
        let newId = '';
        try {
            const payload: Record<string, unknown> = {
                'sms_student@odata.bind':      `/sms_students(${students[0].sms_studentid})`,
                'sms_class@odata.bind':        `/sms_classes(${classes[0].sms_classid})`,
                'sms_academicyear@odata.bind': `/sms_academicyears(${years[0].sms_academicyearid})`,
                sms_enrollmentdate:   '2026-04-21',
                sms_enrollmentstatus: 1,
                sms_rollnumber:       'TEST-001',
            };
            const cr = await axios.post(`${API}/${TABLE}`, payload,
                { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
            newId = cr.data.sms_enrollmentid;
            console.log(`  ✓ CREATE  id=${newId}`);

            await axios.patch(`${API}/${TABLE}(${newId})`, { sms_rollnumber: 'TEST-002', sms_enrollmentstatus: 2 },
                { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
            console.log(`  ✓ UPDATE  roll→TEST-002, status→2`);

            await axios.delete(`${API}/${TABLE}(${newId})`, { headers: h, timeout: 20000 });
            console.log(`  ✓ DELETE`);
        } catch (err: any) {
            console.error('  ✗ CRUD:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
            if (newId) await axios.delete(`${API}/${TABLE}(${newId})`, { headers: h, timeout: 20000 }).catch(() => {});
        }
    } else {
        console.log('④ Skipping CRUD — missing dependencies');
    }

    console.log('\n✅ Enrollments API test complete.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
