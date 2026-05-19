import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function inspectTable(h: Record<string, string>, logicalName: string) {
    console.log(`\n── ${logicalName} ──`);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=LogicalName,AttributeType&$orderby=LogicalName asc`,
            { headers: h, timeout: 20000 }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.data.value.filter((a: any) => a.LogicalName.startsWith('sms_')).forEach((a: any) =>
            console.log(`  ${a.LogicalName}  (${a.AttributeType})`)
        );
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`  ERROR: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }
}

async function main() {
    const tok = await getToken();
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    await inspectTable(h, 'sms_kitchenmenu');
    await inspectTable(h, 'sms_mealorder');
}

main().catch(e => { console.error('Fatal:', (e as any).message); process.exit(1); });
