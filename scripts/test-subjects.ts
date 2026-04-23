/**
 * test-subjects.ts — discovers actual sms_subjects field names then validates the app SELECT.
 * Run: npx ts-node --skip-project scripts/test-subjects.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;
const API_BASE      = `${DATAVERSE_URL}/api/data/v9.2`;
const TABLE         = 'sms_subjects';
const SELECT        = 'sms_subjectid,sms_name,sms_code,sms_description,sms_credithours,sms_passscore,sms_type,_sms_gradelevel_value,_sms_teacher_value,createdon,modifiedon';

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
            scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );
    return res.data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Subjects API Test');
    console.log('══════════════════════════════════════════\n');

    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // ── Raw field discovery ───────────────────────────────────────────────────
    console.log('① Raw record (no $select) — field discovery…');
    try {
        const res = await axios.get(`${API_BASE}/${TABLE}?$top=1`, { headers: h, timeout: 20000 });
        const records: any[] = res.data.value ?? [];
        if (!records.length) {
            console.log('  ⚠ Table is empty\n');
        } else {
            Object.keys(records[0]).sort().forEach((k) => {
                const v = records[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            console.log();
        }
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message));
    }

    // ── App SELECT ────────────────────────────────────────────────────────────
    console.log('② App SELECT query…');
    try {
        const res = await axios.get(`${API_BASE}/${TABLE}?$select=${SELECT}&$orderby=sms_name asc&$top=10`, { headers: h, timeout: 20000 });
        const records: any[] = res.data.value ?? [];
        console.log(`  ✓ ${records.length} record(s)\n`);
        records.forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.sms_name}`);
            console.log(`      ID:          ${r.sms_subjectid}`);
            console.log(`      Code:        ${r.sms_code ?? '—'}`);
            console.log(`      Credit hrs:  ${r.sms_credithours ?? '—'}`);
            console.log(`      Pass score:  ${r.sms_passscore ?? '—'}`);
            console.log(`      Type:        ${r.sms_type ?? '—'}`);
            console.log(`      Grade level: ${r['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Teacher:     ${r['_sms_teacher_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Description: ${r.sms_description ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────
    console.log('③ CRUD test…');
    let newId = '';
    try {
        // CREATE
        const cr = await axios.post(`${API_BASE}/${TABLE}`,
            { sms_name: 'TEST-Subject', sms_code: 'TEST-001' },
            { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
        newId = cr.data.sms_subjectid;
        console.log(`  ✓ CREATE  id=${newId}`);

        // UPDATE
        await axios.patch(`${API_BASE}/${TABLE}(${newId})`,
            { sms_code: 'TEST-002' },
            { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
        console.log(`  ✓ UPDATE  code → TEST-002`);

        // DELETE
        await axios.delete(`${API_BASE}/${TABLE}(${newId})`, { headers: h, timeout: 20000 });
        console.log(`  ✓ DELETE  record removed`);
    } catch (err: any) {
        console.error('  ✗ CRUD failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
        if (newId) {
            await axios.delete(`${API_BASE}/${TABLE}(${newId})`, { headers: h, timeout: 20000 }).catch(() => {});
        }
    }

    console.log('\n✅ Subjects API test complete.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
