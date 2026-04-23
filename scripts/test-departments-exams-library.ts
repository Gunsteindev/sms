/**
 * test-departments-exams-library.ts — raw field discovery + SELECT validation for three tables.
 * Run: npx ts-node --skip-project scripts/test-departments-exams-library.ts
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

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function probeTable(h: Record<string, string>, table: string, appSelect: string, label: string) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  ${label}  (${table})`);
    console.log('═'.repeat(50));

    // Raw discovery
    console.log('\n① Raw record (no $select):');
    try {
        const res = await axios.get(`${API}/${table}?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) { console.log('  ⚠ Table is empty'); }
        else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
        }
    } catch (err: any) {
        console.error('  ✗', err.response?.data?.error?.message ?? err.message);
    }

    // App SELECT validation
    console.log('\n② App SELECT validation:');
    try {
        const res = await axios.get(`${API}/${table}?$select=${appSelect}&$top=5`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ SELECT OK — ${rows.length} record(s)`);
        rows.slice(0, 3).forEach((r, i) => {
            const name = r.sms_name ?? r.sms_title ?? '?';
            console.log(`  [${i + 1}] ${name}`);
        });
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', err.response?.data?.error?.message ?? err.message);
    }
}

async function main() {
    console.log('\nAcquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired');
    const h: Record<string, string> = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    await probeTable(h, 'sms_departments',
        'sms_departmentid,sms_name,sms_description,_sms_headofdepartment_value,createdon,modifiedon',
        'Departments');

    await probeTable(h, 'sms_exams',
        'sms_examid,sms_name,sms_examcode,sms_examtype,sms_startdate,sms_enddate,_sms_academicyear_value,createdon,modifiedon',
        'Exams');

    await probeTable(h, 'sms_libraries',
        'sms_libraryid,sms_name,sms_bookcode,sms_isbn,sms_author,sms_category,sms_quantity,sms_available,createdon,modifiedon',
        'Library');

    console.log('\n✅ Done.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
