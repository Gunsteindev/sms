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

    // Fetch one raw row with no $select — returns all columns that actually exist
    console.log('Fetching raw row from sms_routeassignments (no $select)...\n');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_routeassignments?$top=1`, { headers: h, timeout: 20000 });
        const rows = r.data.value ?? [];
        if (!rows.length) {
            console.log('Table is empty. Fetching metadata instead...');
            // Fetch entity metadata to list attributes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const meta = await axios.get<any>(
                `${API}/EntityDefinitions(LogicalName='sms_routeassignment')/Attributes?$select=LogicalName,DisplayName,AttributeType&$filter=AttributeType ne 'Virtual'&$orderby=LogicalName`,
                { headers: h, timeout: 30000 }
            );
            const attrs = meta.data.value ?? [];
            console.log(`Found ${attrs.length} attributes:\n`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            attrs.forEach((a: any) => {
                const display = a.DisplayName?.UserLocalizedLabel?.Label ?? '';
                console.log(`  ${a.LogicalName.padEnd(40)} [${a.AttributeType}]  "${display}"`);
            });
        } else {
            console.log('Columns present in a live row:\n');
            Object.keys(rows[0]).sort().forEach(k => {
                console.log(`  ${k.padEnd(55)} = ${JSON.stringify(rows[0][k])?.slice(0, 60)}`);
            });
        }
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('Error:', (e as any).response?.data?.error?.message ?? (e as Error).message);
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
