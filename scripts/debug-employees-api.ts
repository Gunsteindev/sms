import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const SELECT = 'sms_employeeid,sms_employeecode,sms_firstname,sms_lastname,sms_dateofbirth,sms_gender,sms_email,sms_phone,sms_address,sms_department,sms_designation,sms_employeetype,sms_hiredate,sms_employeestatus,sms_salary,sms_bankaccount,sms_emergencycontactname,sms_emergencycontactphone,createdon,modifiedon';

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = {
        Authorization: `Bearer ${tok}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // Step 1: get school
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sr = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
    const school = sr.data.value?.[0];
    const schoolId = school?.sms_schoolid;
    console.log(`School: "${school?.sms_name}"  id=${schoolId}\n`);

    // Step 2: exact query the DataverseClient would build
    const baseUrl = `sms_employees?$select=${SELECT}&$orderby=sms_firstname asc`;
    const withSchoolFilter = `${baseUrl}&$filter=_sms_school_value%20eq%20${schoolId}`;

    console.log('--- Query WITHOUT school filter ---');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/${baseUrl}`, { headers: h, timeout: 20000 });
        console.log(`  Result: ${r.data.value?.length ?? 0} records`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (r.data.value?.length) r.data.value.slice(0, 3).forEach((e: any) =>
            console.log(`    "${e.sms_firstname} ${e.sms_lastname}"  email="${e.sms_email}"  status=${e.sms_employeestatus}`)
        );
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('  ERROR:', (e as any).response?.data?.error?.message ?? (e as Error).message);
    }

    console.log('\n--- Query WITH school filter ---');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/${withSchoolFilter}`, { headers: h, timeout: 20000 });
        console.log(`  Result: ${r.data.value?.length ?? 0} records`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (r.data.value?.length) r.data.value.slice(0, 3).forEach((e: any) =>
            console.log(`    "${e.sms_firstname} ${e.sms_lastname}"  email="${e.sms_email}"  status=${e.sms_employeestatus}`)
        );
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('  ERROR:', (e as any).response?.data?.error?.message ?? (e as Error).message);
    }

    // Step 3: check _sms_school_value on actual records
    console.log('\n--- Raw _sms_school_value on first 3 records ---');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_employees?$select=sms_firstname,_sms_school_value&$top=3`, { headers: h, timeout: 20000 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.data.value?.forEach((e: any) => console.log(`  "${e.sms_firstname}"  _sms_school_value="${e._sms_school_value}"`));
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('  ERROR:', (e as any).response?.data?.error?.message ?? (e as Error).message);
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
