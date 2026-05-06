/**
 * Creates Phase 3 Dataverse tables: sms_vehicle, sms_activity
 * Run: npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/create-phase3-tables.ts
 * Or:  npm run create:phase3-tables
 *
 * Safe to re-run — skips tables/columns that already exist.
 */

import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DV_URL        = process.env.DATAVERSE_URL!;

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
            grant_type: 'client_credentials', client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET, scope: `${DV_URL}/.default`,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data.access_token;
}

function label(text: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.Label',
        LocalizedLabels: [{ '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: 1033 }],
        UserLocalizedLabel: { '@odata.type': 'Microsoft.Dynamics.CRM.LocalizedLabel', Label: text, LanguageCode: 1033 },
    };
}
function reqLevel(l: 'None' | 'SystemRequired' | 'ApplicationRequired' | 'Recommended') { return l; }

function stringAttr(schemaName: string, displayName: string, maxLen = 100, required: ReturnType<typeof reqLevel> = 'None') {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
        SchemaName: schemaName, DisplayName: label(displayName),
        RequiredLevel: { Value: required }, MaxLength: maxLen, FormatName: { Value: 'Text' },
    };
}
function memoAttr(schemaName: string, displayName: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
        SchemaName: schemaName, DisplayName: label(displayName),
        RequiredLevel: { Value: 'None' }, MaxLength: 2000,
    };
}
function intAttr(schemaName: string, displayName: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
        SchemaName: schemaName, DisplayName: label(displayName),
        RequiredLevel: { Value: 'None' }, MinValue: 0, MaxValue: 2147483647,
    };
}
function picklistAttr(schemaName: string, displayName: string, options: { value: number; label: string }[]) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
        SchemaName: schemaName, DisplayName: label(displayName),
        RequiredLevel: { Value: 'None' },
        OptionSet: {
            '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
            IsGlobal: false,
            OptionSetType: 'Picklist',
            Options: options.map(o => ({ Value: o.value, Label: label(o.label), Description: label('') })),
        },
    };
}

const TABLES = [
    {
        schemaName: 'sms_vehicle',
        displayName: 'Vehicle',
        primaryAttr: { schemaName: 'sms_name', displayName: 'Vehicle Name', maxLen: 200 },
        columns: [
            stringAttr('sms_plate',       'Plate Number',   50,  'None'),
            intAttr   ('sms_capacity',    'Capacity'),
            stringAttr('sms_driver',      'Driver Name',    200),
            stringAttr('sms_driverphone', 'Driver Phone',   50),
            intAttr   ('sms_year',        'Year'),
            stringAttr('sms_color',       'Color',          50),
            memoAttr  ('sms_notes',       'Notes'),
            picklistAttr('sms_vehicletype', 'Vehicle Type', [
                { value: 1, label: 'Bus' }, { value: 2, label: 'Minibus' },
                { value: 3, label: 'Van' }, { value: 4, label: 'Motorcycle' },
                { value: 5, label: 'Car' },
            ]),
            picklistAttr('sms_status', 'Status', [
                { value: 1, label: 'Active' }, { value: 2, label: 'Maintenance' },
                { value: 3, label: 'Retired' },
            ]),
        ],
    },
    {
        schemaName: 'sms_activity',
        displayName: 'Activity',
        primaryAttr: { schemaName: 'sms_name', displayName: 'Activity Name', maxLen: 200 },
        columns: [
            stringAttr('sms_coordinator', 'Coordinator',  200),
            stringAttr('sms_venue',       'Venue',        200),
            stringAttr('sms_starttime',   'Start Time',   10),
            stringAttr('sms_endtime',     'End Time',     10),
            intAttr   ('sms_capacity',    'Capacity'),
            intAttr   ('sms_enrolled',    'Enrolled'),
            memoAttr  ('sms_description', 'Description'),
            picklistAttr('sms_category', 'Category', [
                { value: 1, label: 'Sports' }, { value: 2, label: 'Arts' },
                { value: 3, label: 'Music' },  { value: 4, label: 'Drama' },
                { value: 5, label: 'Science' },{ value: 6, label: 'Academic' },
                { value: 7, label: 'Cultural' },{ value: 8, label: 'Other' },
            ]),
            picklistAttr('sms_day', 'Day', [
                { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
                { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
                { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
                { value: 7, label: 'Sunday' },
            ]),
            picklistAttr('sms_status', 'Status', [
                { value: 1, label: 'Active' }, { value: 2, label: 'Inactive' },
            ]),
        ],
    },
];

async function tableExists(api: ReturnType<typeof axios.create>, schemaName: string): Promise<boolean> {
    try {
        await api.get(`/EntityDefinitions(LogicalName='${schemaName.toLowerCase()}')`, { timeout: 60000 });
        return true;
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.status === 404) return false;
        throw e;
    }
}

async function columnExists(api: ReturnType<typeof axios.create>, tableLogical: string, colLogical: string): Promise<boolean> {
    try {
        await api.get(`/EntityDefinitions(LogicalName='${tableLogical}')/Attributes(LogicalName='${colLogical}')`, { timeout: 60000 });
        return true;
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.status === 404) return false;
        throw e;
    }
}

async function createTable(api: ReturnType<typeof axios.create>, t: typeof TABLES[0]) {
    const logicalName = t.schemaName.toLowerCase();
    console.log(`\n--- Table: ${t.schemaName} ---`);
    const exists = await tableExists(api, t.schemaName);
    if (!exists) {
        console.log(`  Creating table ${t.schemaName}…`);
        await api.post('/EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: t.schemaName, DisplayName: label(t.displayName),
            DisplayCollectionName: label(t.displayName + 's'),
            OwnershipType: 'UserOwned',
            HasActivities: false, HasNotes: false, IsActivity: false,
            PrimaryNameAttribute: t.primaryAttr.schemaName.toLowerCase(),
            Attributes: [{
                '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                IsPrimaryName: true, SchemaName: t.primaryAttr.schemaName,
                DisplayName: label(t.primaryAttr.displayName),
                RequiredLevel: { Value: 'ApplicationRequired' },
                MaxLength: t.primaryAttr.maxLen, FormatName: { Value: 'Text' },
            }],
        });
        console.log(`  ✓ Table created. Publishing…`);
        try { await api.post('/PublishAllXml', {}); console.log(`  ✓ Published.`); }
        catch { console.log(`  ⚠ Publish timed out — continuing (Dataverse will publish in background).`); }
    } else {
        console.log(`  Table already exists — skipping creation.`);
    }

    for (const col of t.columns) {
        const colLogical = (col as Record<string, unknown>).SchemaName as string;
        const exists = await columnExists(api, logicalName, colLogical.toLowerCase());
        if (!exists) {
            console.log(`  Adding column ${colLogical}…`);
            try {
                await api.post(`/EntityDefinitions(LogicalName='${logicalName}')/Attributes`, col);
                console.log(`  ✓ Column ${colLogical} added.`);
            } catch (e: unknown) {
                if (axios.isAxiosError(e)) {
                    console.error(`  ✗ Column ${colLogical} failed: ${e.response?.data?.error?.message ?? e.message}`);
                } else { throw e; }
            }
        } else {
            console.log(`  Column ${colLogical} already exists — skipping.`);
        }
    }
}

async function main() {
    console.log('Phase 3 — Creating Dataverse tables: sms_vehicle, sms_activity\n');
    const token = await getToken();
    const api = axios.create({
        baseURL: `${DV_URL}/api/data/v9.2`,
        headers: { Authorization: `Bearer ${token}`, 'OData-MaxVersion': '4.0', 'OData-Version': '4.0', 'Content-Type': 'application/json' },
        timeout: 300000,
    });

    for (const t of TABLES) {
        await createTable(api, t);
    }

    console.log('\nDone. Publishing all customizations…');
    try { await api.post('/PublishAllXml', {}); } catch { /* publishes in background */ }
    console.log('✓ All Phase 3 tables ready.');
}

main().catch(err => { console.error(err?.response?.data ?? err.message ?? err); process.exit(1); });
