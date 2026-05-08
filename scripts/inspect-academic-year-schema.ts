import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;

async function main() {
    const token = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 },
    )).data.access_token;

    const h = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-Version': '4.0' };

    // Get one record with all fields (no $select) to see what columns exist
    const res = await axios.get(
        `${D}/api/data/v9.2/sms_academicyears?$top=1`,
        { headers: h, timeout: 30000 },
    );
    if (res.data.value.length === 0) { console.log('No records'); return; }
    const record = res.data.value[0];
    const fields = Object.keys(record).filter(k => !k.startsWith('@'));
    console.log('All fields on sms_academicyears:\n');
    fields.forEach(f => console.log(`  ${f}: ${JSON.stringify(record[f])}`));
}
main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
