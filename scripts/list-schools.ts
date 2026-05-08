import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 },
    )).data.access_token;
}

async function main() {
    const token = await getToken();
    const res = await axios.get(
        `${API}/sms_schools?$select=sms_schoolid,sms_name,sms_motto,sms_type,sms_level,sms_address,sms_district,sms_region,sms_phone,sms_email,sms_currency,sms_website,sms_emiscode&$orderby=sms_name asc`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-Version': '4.0' }, timeout: 30000 },
    );
    console.log(JSON.stringify(res.data.value, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
