import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function main() {
    const tok = (await axios.post(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await axios.get<any>(`${API}/EntityDefinitions?$select=LogicalName,LogicalCollectionName&$filter=IsCustomEntity eq true`, { headers: h, timeout: 30000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.data.value.map((e: any) => e.LogicalCollectionName).filter((n: string) => n?.startsWith('sms_')).sort().forEach((n: string) => console.log(' ', n));
}
main().catch((e: unknown) => { console.error((e as any).response?.data?.error?.message ?? (e as Error).message); process.exit(1); });
