/**
 * test-exams-full.ts — validate the full new SELECT (with class/subject/term/marks fields).
 * Run: npx ts-node --skip-project scripts/test-exams-full.ts
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

// Full SELECT matching src/lib/dataverse/exams.ts
const SELECT = [
    'sms_examid', 'sms_name', 'sms_examcode', 'sms_examtype',
    'sms_startdate', 'sms_enddate',
    'sms_totalmarks', 'sms_passmarks', 'sms_venue', 'sms_weightpercent',
    '_sms_academicyear_value', '_sms_class_value', '_sms_subject_value', '_sms_term_value',
    'createdon', 'modifiedon',
].join(',');

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

    console.log('\n══════ Full SELECT validation ══════\n');

    try {
        const res = await axios.get(
            `${API}/sms_exams?$select=${SELECT}&$orderby=sms_startdate asc&$top=20`,
            { headers: h, timeout: 20000 }
        );
        const rows: any[] = res.data.value ?? [];
        console.log(`✓ SELECT OK — ${rows.length} record(s)\n`);

        rows.forEach((r, i) => {
            const fv = (k: string) => r[`${k}@OData.Community.Display.V1.FormattedValue`] ?? '—';
            console.log(`[${String(i+1).padStart(2)}] ${r.sms_name}`);
            console.log(`     code:       ${r.sms_examcode ?? '—'}`);
            console.log(`     type:       ${r.sms_examtype} (${fv('sms_examtype')})`);
            console.log(`     start:      ${r.sms_startdate?.slice(0,10) ?? '—'}   end: ${r.sms_enddate?.slice(0,10) ?? '—'}`);
            console.log(`     totalmarks: ${r.sms_totalmarks ?? '—'}   passmarks: ${r.sms_passmarks ?? '—'}   weight: ${r.sms_weightpercent ?? '—'}%`);
            console.log(`     venue:      ${r.sms_venue ?? '—'}`);
            console.log(`     class:      ${fv('_sms_class_value')}   subject: ${fv('_sms_subject_value')}`);
            console.log(`     term:       ${fv('_sms_term_value')}   acadyear: ${fv('_sms_academicyear_value')}`);
            console.log();
        });
    } catch (err: any) {
        console.error('✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
    }
}

main().catch((e: any) => { console.error(e.response?.data?.error?.message ?? e.message); process.exit(1); });
