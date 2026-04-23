/**
 * test-attendance-fresh.ts — raw field discovery + SELECT validation + CRUD.
 * Run: npx ts-node --skip-project scripts/test-attendance-fresh.ts
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
const TABLE = 'sms_attendances';

const APP_SELECT = 'sms_attendanceid,sms_name,sms_date,sms_attendancestatus,sms_checkintime,sms_remarks,_sms_student_value,_sms_class_value,_sms_subject_value,createdon';

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Attendance API Test (fresh)');
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
    let sampleDate = '';
    try {
        const res = await axios.get(`${API}/${TABLE}?$top=1&$orderby=createdon desc`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) { console.log('  ⚠ Table is empty\n'); }
        else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            sampleDate = (rows[0].sms_date as string | null)?.slice(0, 10) ?? '';
            console.log();
        }
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message));
    }

    // ── 2. App SELECT ─────────────────────────────────────────────────────────
    console.log('② App SELECT query…');
    try {
        const res = await axios.get(`${API}/${TABLE}?$select=${APP_SELECT}&$orderby=createdon desc&$top=5`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ ${rows.length} record(s)\n`);
        rows.forEach((r, i) => {
            console.log(`  [${i+1}] ${r['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? r.sms_name}`);
            console.log(`      ID:      ${r.sms_attendanceid}`);
            console.log(`      Date:    ${r.sms_date}`);
            console.log(`      Status:  ${r.sms_attendancestatus} (${r['sms_attendancestatus@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      Student: ${r['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Class:   ${r['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Subject: ${r['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Checkin: ${r.sms_checkintime ?? '—'}`);
            console.log(`      Remarks: ${r.sms_remarks ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2), '\n');
    }

    // ── 3. Date filter test ───────────────────────────────────────────────────
    const testDate = sampleDate || new Date().toISOString().slice(0, 10);
    console.log(`③ Date filter test (sms_date eq ${testDate})…`);
    try {
        const res = await axios.get(
            `${API}/${TABLE}?$select=sms_attendanceid,sms_date&$filter=${encodeURIComponent(`sms_date eq ${testDate}`)}&$top=10`,
            { headers: h, timeout: 20000 }
        );
        console.log(`  ✓ Without quotes: ${res.data.value?.length ?? 0} records\n`);
    } catch (err: any) {
        console.error('  ✗ Without quotes:', err.response?.data?.error?.message ?? err.message);
        // try with quotes
        try {
            const res2 = await axios.get(
                `${API}/${TABLE}?$select=sms_attendanceid,sms_date&$filter=${encodeURIComponent(`sms_date eq '${testDate}'`)}&$top=10`,
                { headers: h, timeout: 20000 }
            );
            console.log(`  ✓ With quotes: ${res2.data.value?.length ?? 0} records — use quoted date strings\n`);
        } catch (err2: any) {
            console.error('  ✗ With quotes also failed:', err2.response?.data?.error?.message ?? err2.message, '\n');
        }
    }

    // ── 4. CRUD test ──────────────────────────────────────────────────────────
    console.log('④ Fetching student for CRUD test…');
    let studentId = '';
    try {
        const res = await axios.get(`${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$top=1`, { headers: h, timeout: 20000 });
        const s = res.data.value?.[0];
        if (s) { studentId = s.sms_studentid; console.log(`  Student: ${s.sms_firstname} ${s.sms_lastname}\n`); }
        else console.log('  ⚠ No students\n');
    } catch (err: any) { console.error('  ✗', err.message, '\n'); }

    if (studentId) {
        console.log('⑤ CRUD test…');
        let newId = '';
        try {
            const payload: any = {
                'sms_student@odata.bind': `/sms_students(${studentId})`,
                sms_date: new Date().toISOString().slice(0, 10),
                sms_attendancestatus: 1,
                sms_remarks: 'CRUD test',
            };
            const cr = await axios.post(`${API}/${TABLE}`, payload,
                { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
            newId = cr.data.sms_attendanceid;
            console.log(`  ✓ CREATE id=${newId}`);

            await axios.patch(`${API}/${TABLE}(${newId})`, { sms_attendancestatus: 2, sms_remarks: 'updated' },
                { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
            console.log('  ✓ UPDATE status→2 (Absent)');

            await axios.delete(`${API}/${TABLE}(${newId})`, { headers: h, timeout: 20000 });
            console.log('  ✓ DELETE');
        } catch (err: any) {
            console.error('  ✗ CRUD:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
            if (newId) await axios.delete(`${API}/${TABLE}(${newId})`, { headers: h, timeout: 20000 }).catch(() => {});
        }
    }

    console.log('\n✅ Attendance API test complete.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
