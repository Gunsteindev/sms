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

    const res = await axios.get(
        `${D}/api/data/v9.2/sms_academicyears?$select=sms_academicyearid,sms_name,sms_startdate,sms_enddate,sms_iscurrent,sms_yearname,sms_description&$orderby=sms_startdate asc`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-Version': '4.0' }, timeout: 30000 },
    );
    console.log(JSON.stringify(res.data.value, null, 2));
}
main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
