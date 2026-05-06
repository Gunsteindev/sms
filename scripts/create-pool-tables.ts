/**
 * Creates the three Pool Management Dataverse tables:
 *   sms_poolsession     — Pool sessions (school / public)
 *   sms_poolrental      — Rental items (swimwear, equipment)
 *   sms_pooltransaction — Sales & entry transactions
 *
 * Run: npm run create:pool-tables
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios, { AxiosInstance } from 'axios';

const TENANT   = process.env.AZURE_TENANT_ID!;
const CLIENT   = process.env.AZURE_CLIENT_ID!;
const SECRET   = process.env.AZURE_CLIENT_SECRET!;
const DV_URL   = process.env.DATAVERSE_URL!;
const API      = `${DV_URL}/api/data/v9.2`;
const LANG     = 1033; // English

// ─── helpers ────────────────────────────────────────────────────────────────

function label(text: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.Label',
        LocalizedLabels: [{ '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: LANG }],
        UserLocalizedLabel: { '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: LANG },
    };
}

function reqLevel(value: 'None' | 'Recommended' | 'ApplicationRequired') {
    return { Value: value, CanBeChanged: true, ManagedPropertyLogicalName: 'canmodifyrequirementlevelsettings' };
}

function stringAttr(schemaName: string, displayName: string, maxLength = 255, required: 'None' | 'ApplicationRequired' = 'None') {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel(required),
        MaxLength: maxLength,
        FormatName: { Value: 'Text' },
        DisplayName: label(displayName),
    };
}

function memoAttr(schemaName: string, displayName: string, maxLength = 2000) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel('None'),
        MaxLength: maxLength,
        Format: 'TextArea',
        DisplayName: label(displayName),
    };
}

function intAttr(schemaName: string, displayName: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel('None'),
        Format: 'None',
        MinValue: 0,
        MaxValue: 2147483647,
        DisplayName: label(displayName),
    };
}

function decimalAttr(schemaName: string, displayName: string, precision = 2) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel('None'),
        MinValue: 0,
        MaxValue: 1000000000,
        Precision: precision,
        DisplayName: label(displayName),
    };
}

function dateAttr(schemaName: string, displayName: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel('None'),
        Format: 'DateOnly',
        DateTimeBehavior: { Value: 'DateOnly' },
        DisplayName: label(displayName),
    };
}

function picklistAttr(schemaName: string, displayName: string, options: { value: number; label: string }[]) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
        SchemaName: schemaName,
        RequiredLevel: reqLevel('None'),
        DisplayName: label(displayName),
        OptionSet: {
            '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
            IsGlobal: false,
            OptionSetType: 'Picklist',
            Options: options.map(o => ({
                Value: o.value,
                Label: label(o.label),
                Description: label(''),
            })),
        },
    };
}

// ─── entity definitions ──────────────────────────────────────────────────────

const TABLES = [
    {
        schemaName: 'sms_poolsession',
        singular: 'Pool Session',
        plural: 'Pool Sessions',
        primaryName: 'sms_name',
        primaryLabel: 'Session Name',
        primaryMaxLength: 200,
        attrs: [
            dateAttr     ('sms_sessiondate',   'Session Date'),
            picklistAttr ('sms_mode',          'Mode', [
                { value: 1, label: 'School' },
                { value: 2, label: 'Public' },
            ]),
            picklistAttr ('sms_shift',         'Shift', [
                { value: 1, label: 'Morning' },
                { value: 2, label: 'Afternoon' },
                { value: 3, label: 'Full Day' },
            ]),
            intAttr      ('sms_studentscount', 'Students'),
            intAttr      ('sms_adultscount',   'Adults (Public)'),
            intAttr      ('sms_childrencount', 'Children (Public)'),
            intAttr      ('sms_entrycount',    'Total Entries'),
            decimalAttr  ('sms_entryfee',      'Entry Fee (GHS)'),
            decimalAttr  ('sms_totalrevenue',  'Total Revenue (GHS)'),
            picklistAttr ('sms_status',        'Status', [
                { value: 1, label: 'Open' },
                { value: 2, label: 'Closed' },
            ]),
            memoAttr     ('sms_notes',         'Notes'),
        ],
    },
    {
        schemaName: 'sms_poolrental',
        singular: 'Pool Rental Item',
        plural: 'Pool Rental Items',
        primaryName: 'sms_name',
        primaryLabel: 'Item Name',
        primaryMaxLength: 200,
        attrs: [
            picklistAttr ('sms_category',   'Category', [
                { value: 1, label: 'Swimsuit' },
                { value: 2, label: 'Swimming Cap' },
                { value: 3, label: 'Goggles' },
                { value: 4, label: 'Fins' },
                { value: 5, label: 'Kickboard' },
                { value: 6, label: 'Other' },
            ]),
            stringAttr   ('sms_size',       'Size', 50),
            intAttr      ('sms_totalqty',   'Total Quantity'),
            intAttr      ('sms_available',  'Available'),
            intAttr      ('sms_inuse',      'In Use'),
            intAttr      ('sms_cleaning',   'Cleaning'),
            intAttr      ('sms_damaged',    'Damaged'),
            decimalAttr  ('sms_rentalfee',  'Rental Fee (GHS)'),
            decimalAttr  ('sms_depositfee', 'Deposit Fee (GHS)'),
        ],
    },
    {
        schemaName: 'sms_pooltransaction',
        singular: 'Pool Transaction',
        plural: 'Pool Transactions',
        primaryName: 'sms_name',
        primaryLabel: 'Transaction Ref',
        primaryMaxLength: 200,
        attrs: [
            dateAttr     ('sms_transdate',       'Transaction Date'),
            stringAttr   ('sms_sessionref',      'Session Ref', 200),
            picklistAttr ('sms_transtype',       'Type', [
                { value: 1, label: 'Entry Fee' },
                { value: 2, label: 'Snack Sale' },
                { value: 3, label: 'Drink Sale' },
                { value: 4, label: 'Swimwear Sale' },
                { value: 5, label: 'Rental' },
                { value: 6, label: 'Other Sale' },
            ]),
            stringAttr   ('sms_itemname',        'Item', 200),
            intAttr      ('sms_quantity',         'Quantity'),
            decimalAttr  ('sms_unitprice',        'Unit Price (GHS)'),
            decimalAttr  ('sms_totalamount',      'Total (GHS)'),
            stringAttr   ('sms_customername',    'Customer / Student Name', 200),
            picklistAttr ('sms_paymentmethod',   'Payment Method', [
                { value: 1, label: 'Cash' },
                { value: 2, label: 'Mobile Money' },
                { value: 3, label: 'Card' },
            ]),
            stringAttr   ('sms_notes',           'Notes', 500),
        ],
    },
];

// ─── main ────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id: CLIENT, client_secret: SECRET,
            scope: `${DV_URL}/.default`, grant_type: 'client_credentials',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 },
    );
    return res.data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
        },
        timeout: 300000,
    });
}

async function tableExists(client: AxiosInstance, logicalName: string): Promise<boolean> {
    try {
        await client.get(`/EntityDefinitions(LogicalName='${logicalName}')?$select=LogicalName`, { timeout: 60000 });
        return true;
    } catch {
        return false;
    }
}

async function createTable(client: AxiosInstance, table: typeof TABLES[0]): Promise<void> {
    const exists = await tableExists(client, table.schemaName);
    if (exists) {
        console.log(`  [SKIP] ${table.schemaName} already exists`);
        return;
    }

    const payload = {
        '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
        SchemaName: table.schemaName,
        DisplayName: label(table.singular),
        DisplayCollectionName: label(table.plural),
        Description: label(`${table.plural} managed by SchoolMS`),
        OwnershipType: 'UserOwned',
        HasActivities: false,
        HasNotes: false,
        IsActivity: false,
        Attributes: [
            {
                '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                SchemaName: table.primaryName,
                RequiredLevel: reqLevel('ApplicationRequired'),
                MaxLength: table.primaryMaxLength,
                FormatName: { Value: 'Text' },
                IsPrimaryName: true,
                DisplayName: label(table.primaryLabel),
            },
        ],
    };

    await client.post('/EntityDefinitions', payload);
    console.log(`  [OK]   ${table.schemaName} created`);
}

async function addColumn(
    client: AxiosInstance,
    logicalName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attr: any,
): Promise<void> {
    try {
        await client.get(
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes(LogicalName='${attr.SchemaName.toLowerCase()}')` +
            `?$select=LogicalName`,
            { timeout: 60000 },
        );
        console.log(`    [SKIP] ${attr.SchemaName} already exists`);
    } catch (checkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (checkErr as any)?.response?.status;
        if (status && status !== 404) {
            throw checkErr;
        }
        await client.post(
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes`,
            attr,
        );
        console.log(`    [OK]   ${attr.SchemaName} created`);
    }
}

async function main() {
    console.log('\n=== Pool Management Table Creation ===\n');

    if (!TENANT || !CLIENT || !SECRET || !DV_URL) {
        console.error('Missing required env vars. Check AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, DATAVERSE_URL');
        process.exit(1);
    }

    console.log('Authenticating…');
    const token  = await getToken();
    const client = makeClient(token);
    console.log('Authenticated.\n');

    for (const table of TABLES) {
        console.log(`\nTable: ${table.schemaName}`);
        await createTable(client, table);

        console.log(`  Adding columns to ${table.schemaName}…`);
        for (const attr of table.attrs) {
            await addColumn(client, table.schemaName, attr);
        }
    }

    // Publish all customisations
    console.log('\nPublishing customisations…');
    try {
        await client.post('/PublishAllXml', {});
        console.log('Published.');
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.warn('PublishAllXml warning (non-fatal):', (e as any)?.response?.data?.error?.message ?? (e as Error).message);
    }

    console.log('\n=== Done ===');
    console.log('Verify in Power Apps: https://make.powerapps.com → Tables → Custom\n');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (e as any)?.response?.data?.error?.message ?? (e as Error).message;
    console.error('\nFailed:', msg);
    process.exit(1);
});
