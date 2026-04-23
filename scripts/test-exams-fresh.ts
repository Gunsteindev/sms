/**
 * test-exams-fresh.ts — raw discovery + SELECT validation + CRUD for sms_exams.
 * Run: npx ts-node --skip-project scripts/test-exams-fresh.ts
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

// Current app SELECT
const EXAM_SELECT = 'sms_examid,sms_name,sms_examcode,sms_examtype,sms_startdate,sms_enddate,_sms_academicyear_value,createdon,modifiedon';

async function main() {
    const token = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;

    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    console.log('\n══════════════════ sms_exams ══════════════════\n');

    // ① Raw discovery
    console.log('① Raw record (no $select — actual fields from Dataverse):');
    try {
        const res = await axios.get(`${API}/sms_exams?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) {
            console.log('  ⚠ Table is empty — using metadata API instead');
            const meta = await axios.get(
                `${API}/EntityDefinitions(LogicalName='sms_exam')/Attributes?$filter=IsCustomAttribute eq true&$select=LogicalName,AttributeType`,
                { headers: h, timeout: 30000 }
            );
            meta.data.value.sort((a: any, b: any) => a.LogicalName.localeCompare(b.LogicalName))
                .forEach((a: any) => console.log(`  ${a.LogicalName.padEnd(40)} ${a.AttributeType}`));
        } else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
        }
    } catch (err: any) { console.error('  ✗', err.response?.data?.error?.message ?? err.message); }

    // ② App SELECT
    console.log('\n② App SELECT validation:');
    try {
        const res = await axios.get(`${API}/sms_exams?$select=${EXAM_SELECT}&$orderby=sms_startdate desc&$top=5`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ SELECT OK — ${rows.length} record(s)`);
        rows.forEach((r, i) => {
            console.log(`\n  [${i+1}] ${r.sms_name}`);
            console.log(`      examid:    ${r.sms_examid}`);
            console.log(`      examcode:  ${r.sms_examcode ?? '—'}`);
            console.log(`      examtype:  ${r.sms_examtype} (${r['sms_examtype@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      startdate: ${r.sms_startdate ?? '—'}`);
            console.log(`      enddate:   ${r.sms_enddate ?? '—'}`);
            console.log(`      acadyear:  ${r['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
        });
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
        return;
    }

    // ③ CRUD
    console.log('\n③ CRUD test:');
    let id = '';
    try {
        const cr = await axios.post(`${API}/sms_exams`,
            { sms_name: '__test_exam_crud__', sms_examtype: 1, sms_startdate: '2026-04-22T00:00:00Z', sms_enddate: '2026-04-22T00:00:00Z' },
            { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
        id = cr.data.sms_examid;
        console.log(`  ✓ CREATE  id=${id}`);
        console.log(`    returned: name="${cr.data.sms_name}"  type=${cr.data.sms_examtype}`);
        console.log(`    start="${cr.data.sms_startdate}"  end="${cr.data.sms_enddate}"`);

        await axios.patch(`${API}/sms_exams(${id})`,
            { sms_examcode: 'TEST-001', sms_examtype: 3 },
            { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
        console.log('  ✓ UPDATE  examcode→TEST-001, type→3(Final)');

        const rb = await axios.get(`${API}/sms_exams(${id})?$select=${EXAM_SELECT}`, { headers: h, timeout: 20000 });
        console.log(`  ✓ READ    code="${rb.data.sms_examcode}"  type=${rb.data.sms_examtype}`);

        await axios.delete(`${API}/sms_exams(${id})`, { headers: h, timeout: 20000 });
        console.log('  ✓ DELETE');
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
        if (id) await axios.delete(`${API}/sms_exams(${id})`, { headers: h, timeout: 20000 }).catch(() => {});
    }

    // ④ Also confirm exam results SELECT still works
    console.log('\n══════════════════ sms_examresults (SELECT check) ══════════════════\n');
    const RESULT_SELECT = 'sms_examresultid,sms_name,sms_score,sms_percentage,sms_gradeletter,sms_gradepointvalue,sms_ispassed,sms_remarks,_sms_exam_value,_sms_student_value,createdon,modifiedon';
    try {
        const res = await axios.get(`${API}/sms_examresults?$select=${RESULT_SELECT}&$top=3`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ SELECT OK — ${rows.length} record(s)`);
        rows.forEach((r, i) => {
            console.log(`  [${i+1}] score=${r.sms_score}  pct=${r.sms_percentage}  grade=${r.sms_gradeletter}  passed=${r.sms_ispassed}`);
            console.log(`       exam="${r['_sms_exam_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}"  student="${r['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}"`);
        });
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
    }

    console.log('\n✅ Done.\n');
}

main().catch((e: any) => { console.error(e.response?.data?.error?.message ?? e.message); process.exit(1); });
