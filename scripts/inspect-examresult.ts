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
    const token = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;

    const h = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    console.log('\nsms_examresult — all custom attributes:\n');
    const meta = await axios.get(
        `${API}/EntityDefinitions(LogicalName='sms_examresult')/Attributes?$filter=IsCustomAttribute eq true&$select=LogicalName,AttributeType`,
        { headers: h, timeout: 30000 }
    );
    meta.data.value
        .sort((a: any, b: any) => a.LogicalName.localeCompare(b.LogicalName))
        .forEach((a: any) => console.log(`  ${a.LogicalName.padEnd(40)} ${a.AttributeType}`));
}

main().catch((e: any) => { console.error(e.response?.data?.error?.message ?? e.message); process.exit(1); });
