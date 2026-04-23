/**
 * test-teachers.ts
 * Tests the sms_teachers Dataverse table — discovers actual field names,
 * then validates the SELECT query used by the app.
 * Run: npx ts-node --skip-project scripts/test-teachers.ts
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

const TABLE  = 'sms_teachers';
const SELECT = 'sms_teacherid,sms_firstname,sms_lastname,sms_dateofbirth,sms_gender,sms_email,sms_phone,sms_address,sms_hiredate,sms_qualification,sms_specialization,sms_employeeid,sms_teacherstatus,_sms_class_value,createdon,modifiedon';

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope:         `${DATAVERSE_URL}/.default`,
            grant_type:    'client_credentials',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );
    return res.data.access_token;
}

function dvHeaders(token: string) {
    return {
        Authorization:    `Bearer ${token}`,
        Accept:           'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version':    '4.0',
        Prefer:           'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Teachers API Test');
    console.log('══════════════════════════════════════════\n');

    // ── 1. Auth ──────────────────────────────────────────────────────────────────
    console.log('① Acquiring token…');
    let token: string;
    try {
        token = await getToken();
        console.log('  ✓ Token acquired\n');
    } catch (err: any) {
        console.error('  ✗ Token failed:', err.response?.data ?? err.message);
        process.exit(1);
    }

    const headers = dvHeaders(token);

    // ── 2. Fetch one raw record (no $select) to discover real field names ────────
    console.log('② Fetching 1 raw record (no $select) to discover field names…');
    try {
        const res = await axios.get(`${API_BASE}/${TABLE}?$top=1`, { headers, timeout: 20000 });
        const records = res.data.value ?? [];
        if (!records.length) {
            console.log('  ⚠ No records found — table may be empty');
        } else {
            const raw = records[0];
            const keys = Object.keys(raw).sort();
            console.log(`  ✓ Got 1 record. Fields (${keys.length}):`);
            keys.forEach((k) => {
                const val = raw[k];
                const display = val === null ? 'null' : typeof val === 'string' ? `"${String(val).slice(0, 60)}"` : String(val);
                console.log(`      ${k}: ${display}`);
            });
        }
        console.log();
    } catch (err: any) {
        const detail = err.response?.data?.error ?? err.response?.data ?? err.message;
        console.error('  ✗ Raw fetch failed:', JSON.stringify(detail, null, 2));
    }

    // ── 3. Test the exact SELECT the app uses ────────────────────────────────────
    console.log('③ Testing app SELECT query…');
    try {
        const url = `${API_BASE}/${TABLE}?$select=${SELECT}&$orderby=sms_firstname asc&$top=5`;
        const res = await axios.get(url, { headers, timeout: 20000 });
        const records = res.data.value ?? [];
        console.log(`  ✓ SELECT succeeded — returned ${records.length} record(s)`);
        records.forEach((r: any, i: number) => {
            console.log(`\n  [${i + 1}] ${r.sms_firstname ?? ''} ${r.sms_lastname ?? ''}`);
            console.log(`      ID:             ${r.sms_teacherid}`);
            console.log(`      Email:          ${r.sms_email ?? '—'}`);
            console.log(`      Phone:          ${r.sms_phone ?? '—'}`);
            console.log(`      Employee ID:    ${r.sms_employeeid ?? '—'}`);
            console.log(`      Qualification:  ${r.sms_qualification ?? '—'}`);
            console.log(`      Specialization: ${r.sms_specialization ?? '—'}`);
            console.log(`      Status:         ${r.sms_teacherstatus ?? '—'} (${r['sms_teacherstatus@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      Hire Date:      ${r.sms_hiredate ? (r.sms_hiredate as string).slice(0,10) : '—'}`);
            console.log(`      DOB:            ${r.sms_dateofbirth ? (r.sms_dateofbirth as string).slice(0,10) : '—'}`);
            console.log(`      Gender:         ${r.sms_gender ?? '—'} (${r['sms_gender@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      Class:          ${r['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Address:        ${r.sms_address ?? '—'}`);
            console.log(`      Created:        ${r.createdon ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        const detail = err.response?.data?.error ?? err.response?.data ?? err.message;
        console.error('  ✗ SELECT failed:', JSON.stringify(detail, null, 2));
    }

    // ── 4. Test search filter ────────────────────────────────────────────────────
    console.log('④ Testing search filter (contains on firstname/lastname)…');
    try {
        const filter = encodeURIComponent(`contains(sms_firstname,'a') or contains(sms_lastname,'a')`);
        const url = `${API_BASE}/${TABLE}?$select=sms_teacherid,sms_firstname,sms_lastname&$filter=${filter}&$top=3`;
        const res = await axios.get(url, { headers, timeout: 20000 });
        const records = res.data.value ?? [];
        console.log(`  ✓ Filter succeeded — ${records.length} match(es)`);
        records.forEach((r: any) => console.log(`      → ${r.sms_firstname} ${r.sms_lastname}`));
        console.log();
    } catch (err: any) {
        const detail = err.response?.data?.error ?? err.response?.data ?? err.message;
        console.error('  ✗ Filter failed:', JSON.stringify(detail, null, 2));
    }

    // ── 5. Test status filter ────────────────────────────────────────────────────
    console.log('⑤ Testing status filter (sms_teacherstatus eq 1)…');
    try {
        const filter = encodeURIComponent(`sms_teacherstatus eq 1`);
        const url = `${API_BASE}/${TABLE}?$select=sms_teacherid,sms_firstname,sms_teacherstatus&$filter=${filter}&$top=3`;
        const res = await axios.get(url, { headers, timeout: 20000 });
        const records = res.data.value ?? [];
        console.log(`  ✓ Status filter succeeded — ${records.length} active teacher(s)`);
        records.forEach((r: any) => console.log(`      → ${r.sms_firstname}  status=${r.sms_teacherstatus}`));
        console.log();
    } catch (err: any) {
        const detail = err.response?.data?.error ?? err.response?.data ?? err.message;
        console.error('  ✗ Status filter failed:', JSON.stringify(detail, null, 2));
    }

    console.log('✅ Teacher API test complete.\n');
}

main();
