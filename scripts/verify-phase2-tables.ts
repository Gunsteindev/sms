/**
 * Verifies that the Phase 2 tables exist and lists their custom columns.
 * Run: npx tsx scripts/verify-phase2-tables.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const TABLES = ['sms_inventoryitem', 'sms_expenditure', 'sms_staffleave'];

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 },
    )).data.access_token;

    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    for (const table of TABLES) {
        console.log(`\n${table}`);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const meta = await axios.get<any>(
                `${API}/EntityDefinitions(LogicalName='${table}')?$select=LogicalName,LogicalCollectionName,PrimaryIdAttribute,PrimaryNameAttribute`,
                { headers: h, timeout: 20000 },
            );
            console.log(`  LogicalCollectionName : ${meta.data.LogicalCollectionName}`);
            console.log(`  PrimaryIdAttribute    : ${meta.data.PrimaryIdAttribute}`);
            console.log(`  PrimaryNameAttribute  : ${meta.data.PrimaryNameAttribute}`);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = await axios.get<any>(
                `${API}/EntityDefinitions(LogicalName='${table}')/Attributes?$select=LogicalName,AttributeType&$filter=startswith(LogicalName,'sms_')`,
                { headers: h, timeout: 20000 },
            );
            console.log('  Columns:');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            r.data.value.sort((a: any, b: any) => a.LogicalName.localeCompare(b.LogicalName))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .forEach((col: any) => console.log(`    ${col.LogicalName.padEnd(32)} ${col.AttributeType}`));
        } catch {
            console.log('  NOT FOUND');
        }
    }
    console.log('');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
