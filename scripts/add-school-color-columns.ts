/**
 * add-school-color-columns.ts
 *
 * Adds sms_primarycolor and sms_sidebarcolor (Text, 20 chars) columns to the
 * sms_schools entity, so the School Profile "Brand Colors" section can persist
 * server-side (read by mapSchool / written by buildSchoolPayload in
 * src/lib/dataverse/school.ts).
 *
 * Run: npx ts-node --skipProject scripts/add-school-color-columns.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    )).data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        timeout: 60_000,
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
        },
    });
}

const label = (text: string) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.Label',
    LocalizedLabels: [{ '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: 1033 }],
});

const stringAttr = (schemaName: string, displayName: string, maxLength: number) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
    SchemaName: schemaName,
    DisplayName: label(displayName),
    RequiredLevel: { Value: 'None' },
    MaxLength: maxLength,
    FormatName: { Value: 'Text' },
});

async function addColumnIfMissing(client: AxiosInstance, logicalName: string, attr: ReturnType<typeof stringAttr>): Promise<void> {
    try {
        await client.get(
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes(LogicalName='${attr.SchemaName.toLowerCase()}')?$select=LogicalName`,
        );
        console.log(`  [SKIP] ${attr.SchemaName} already exists`);
    } catch (e: unknown) {
        const status = axios.isAxiosError(e) ? e.response?.status : undefined;
        if (status !== 404) throw e;
        await client.post(`/EntityDefinitions(LogicalName='${logicalName}')/Attributes`, attr);
        console.log(`  [OK]   ${attr.SchemaName} created`);
    }
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    const token  = await getToken();
    const client = makeClient(token);

    // Resolve the logical name for the sms_schools entity set
    const ed = await client.get(`/EntityDefinitions?$filter=EntitySetName eq 'sms_schools'&$select=LogicalName,EntitySetName`);
    const logicalName = ed.data.value[0]?.LogicalName;
    if (!logicalName) { console.error('Could not resolve LogicalName for sms_schools'); process.exit(1); }
    console.log(`Entity logical name: ${logicalName}`);

    console.log('Adding columns…');
    await addColumnIfMissing(client, logicalName, stringAttr('sms_primarycolor', 'Primary Color', 20));
    await addColumnIfMissing(client, logicalName, stringAttr('sms_sidebarcolor', 'Sidebar Color', 20));

    console.log('Publishing customizations…');
    await client.post('/PublishXml', {
        ParameterXml: `<importexportxml><entities><entity>${logicalName}</entity></entities></importexportxml>`,
    });
    console.log('  ✓ Published');

    console.log('Verifying via $select…');
    const probe = await client.get(`/sms_schools?$select=sms_schoolid,sms_name,sms_primarycolor,sms_sidebarcolor&$top=1`);
    console.log(JSON.stringify(probe.data.value[0], null, 2));
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (e as any)?.response?.data?.error?.message ?? (e as Error).message;
    console.error('\nFailed:', msg);
    process.exit(1);
});
