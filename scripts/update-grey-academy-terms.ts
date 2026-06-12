/**
 * update-grey-academy-terms.ts
 *
 * Removes the leftover test "sms_terms" records for Grey Academy
 * (junk created by CRUD test scripts, unlinked to any academic year)
 * and replaces them with 3 real-world terms for the current
 * 2025-2026 academic year, following the Ghana GES school calendar.
 *
 * Run: npx ts-node --skipProject scripts/update-grey-academy-terms.ts
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

const GREY_ACADEMY_ID = '3a5c5d93-b948-f111-bec6-7ced8d6e6816';
const CURRENT_AY_ID   = 'ba93c81c-2e4b-f111-bec6-7ced8d6e6816'; // 2025-2026

const REAL_TERMS = [
    { name: 'Term 1', startdate: '2025-09-01', enddate: '2025-12-19' },
    { name: 'Term 2', startdate: '2026-01-05', enddate: '2026-04-03' },
    { name: 'Term 3', startdate: '2026-04-20', enddate: '2026-07-31' },
];

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    )).data.access_token;
}

function hdrs(token: string) {
    return {
        Authorization:      `Bearer ${token}`,
        'Content-Type':     'application/json',
        Accept:             'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version':    '4.0',
    };
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars'); process.exit(1); }

    const token = await getToken();
    const h = hdrs(token);

    // Delete existing junk term records for Grey Academy
    const existing = (await axios.get(
        `${API}/sms_terms?$select=sms_termid,sms_name&$filter=${encodeURIComponent(`_sms_school_value eq ${GREY_ACADEMY_ID}`)}`,
        { headers: h, timeout: 20_000 },
    )).data.value;

    console.log(`Deleting ${existing.length} existing term record(s)…`);
    for (const t of existing) {
        await axios.delete(`${API}/sms_terms(${t.sms_termid})`, { headers: h, timeout: 30_000 });
        console.log(`  ✓ Deleted  ${t.sms_name}  (${t.sms_termid})`);
    }

    // Create the 3 real terms for the current academic year
    console.log('\nCreating real-world terms for 2025-2026…');
    for (const term of REAL_TERMS) {
        const payload = {
            sms_name:      term.name,
            sms_startdate: term.startdate,
            sms_enddate:   term.enddate,
            'sms_school@odata.bind':       `/sms_schools(${GREY_ACADEMY_ID})`,
            'sms_academicyear@odata.bind': `/sms_academicyears(${CURRENT_AY_ID})`,
        };
        await axios.post(`${API}/sms_terms`, payload, { headers: h, timeout: 30_000 });
        console.log(`  ✓ Created  ${term.name}  (${term.startdate} → ${term.enddate})`);
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
