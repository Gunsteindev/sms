/**
 * Creates the three Phase 2 Dataverse tables:
 *   sms_inventoryitems  — Inventory stock management
 *   sms_expenditures    — Procurement & expenditures
 *   sms_staffleave      — Staff leave requests
 *
 * Run: npx tsx scripts/create-phase2-tables.ts
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
        schemaName: 'sms_inventoryitem',
        singular: 'Inventory Item',
        plural: 'Inventory Items',
        primaryName: 'sms_name',
        attrs: [
            stringAttr('sms_category',        'Category'),
            intAttr   ('sms_quantity',         'Quantity'),
            stringAttr('sms_unit',             'Unit'),
            decimalAttr('sms_unitprice',       'Unit Price'),
            intAttr   ('sms_reorderlevel',     'Reorder Level'),
            stringAttr('sms_supplier',         'Supplier'),
            stringAttr('sms_suppliercontact',  'Supplier Contact'),
            stringAttr('sms_location',         'Storage Location'),
            memoAttr  ('sms_description',      'Description'),
        ],
    },
    {
        schemaName: 'sms_expenditure',
        singular: 'Expenditure',
        plural: 'Expenditures',
        primaryName: 'sms_name',
        attrs: [
            decimalAttr('sms_amount',          'Amount'),
            picklistAttr('sms_category',       'Category', [
                { value: 1, label: 'Supplies' },
                { value: 2, label: 'Equipment' },
                { value: 3, label: 'Services' },
                { value: 4, label: 'Maintenance' },
                { value: 5, label: 'Utilities' },
                { value: 6, label: 'Other' },
            ]),
            dateAttr  ('sms_expendituredate',  'Expenditure Date'),
            stringAttr('sms_supplier',         'Supplier / Vendor'),
            stringAttr('sms_approvedby',       'Approved By'),
            picklistAttr('sms_status',         'Status', [
                { value: 1, label: 'Pending' },
                { value: 2, label: 'Approved' },
                { value: 3, label: 'Paid' },
                { value: 4, label: 'Rejected' },
            ]),
            stringAttr('sms_reference',        'Reference Number'),
            memoAttr  ('sms_notes',            'Notes'),
        ],
    },
    {
        schemaName: 'sms_staffleave',
        singular: 'Staff Leave',
        plural: 'Staff Leaves',
        primaryName: 'sms_name',
        attrs: [
            stringAttr('sms_employeeid',       'Employee ID'),
            stringAttr('sms_employeename',     'Employee Name'),
            picklistAttr('sms_leavetype',      'Leave Type', [
                { value: 1, label: 'Annual' },
                { value: 2, label: 'Sick' },
                { value: 3, label: 'Maternity/Paternity' },
                { value: 4, label: 'Compassionate' },
                { value: 5, label: 'Study' },
                { value: 6, label: 'Unpaid' },
            ]),
            dateAttr  ('sms_startdate',        'Start Date'),
            dateAttr  ('sms_enddate',          'End Date'),
            intAttr   ('sms_days',             'Number of Days'),
            memoAttr  ('sms_reason',           'Reason'),
            picklistAttr('sms_status',         'Status', [
                { value: 1, label: 'Pending' },
                { value: 2, label: 'Approved' },
                { value: 3, label: 'Rejected' },
                { value: 4, label: 'Cancelled' },
            ]),
            stringAttr('sms_approvedby',       'Approved By'),
            memoAttr  ('sms_comments',         'Comments'),
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
        timeout: 30000,
    });
}

async function tableExists(client: AxiosInstance, logicalName: string): Promise<boolean> {
    try {
        await client.get(`/EntityDefinitions(LogicalName='${logicalName}')?$select=LogicalName`, { timeout: 10000 });
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
            // Primary name column — required by Dataverse
            {
                '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                SchemaName: table.primaryName,
                RequiredLevel: reqLevel('ApplicationRequired'),
                MaxLength: 255,
                FormatName: { Value: 'Text' },
                IsPrimaryName: true,
                DisplayName: label('Name'),
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
        // Check if column already exists
        await client.get(
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes(LogicalName='${attr.SchemaName.toLowerCase()}')` +
            `?$select=LogicalName`,
            { timeout: 10000 },
        );
        console.log(`    [SKIP] ${attr.SchemaName} already exists`);
    } catch (checkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (checkErr as any)?.response?.status;
        if (status && status !== 404) {
            // Unexpected error — re-throw
            throw checkErr;
        }
        // 404 or timeout = does not exist — create it
        await client.post(
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes`,
            attr,
        );
        console.log(`    [OK]   ${attr.SchemaName} created`);
    }
}

async function main() {
    console.log('\n=== Phase 2 Table Creation ===\n');

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

    console.log('\n=== Done ===');
    console.log('Verify in Power Apps: https://make.powerapps.com → Tables → Custom\n');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (e as any)?.response?.data?.error?.message ?? (e as Error).message;
    console.error('\nFailed:', msg);
    process.exit(1);
});
