import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    // List all schools
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sr = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$orderby=sms_name asc`, { headers: h, timeout: 20000 });
    const schools = sr.data.value ?? [];
    console.log(`Found ${schools.length} school(s):\n`);

    for (const school of schools) {
        // Count employees per school
        const filter = encodeURIComponent(`_sms_school_value eq ${school.sms_schoolid}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const er = await axios.get<any>(
            `${API}/sms_employees?$select=sms_employeeid&$filter=${filter}&$count=true`,
            { headers: h, timeout: 20000 }
        );
        const count = er.data['@odata.count'] ?? er.data.value?.length ?? 0;
        console.log(`  ${school.sms_name.padEnd(30)} id=${school.sms_schoolid}  employees=${count}`);
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
