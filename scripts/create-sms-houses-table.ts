/**
 * create-sms-houses-table.ts
 *
 * Migrate Houses & Streams from localStorage-only (SchoolSettingsContext) to a
 * Dataverse-backed entity, matching the schema to be coded in
 * src/lib/dataverse/houses.ts:
 *   sms_name (primary), sms_type (picklist 1-3), sms_color (string),
 *   sms_description (memo), sms_ordernumber (integer)
 * plus lookup: sms_school.
 *
 * Run: npx ts-node --skipProject scripts/create-sms-houses-table.ts
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
        timeout: 120_000,
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

const reqLevel = (value: string) => ({ Value: value });

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Create Dataverse table: sms_house');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // ── 1. Create entity with primary name + simple attributes ──
    console.log('1. Creating entity sms_house with attributes');
    try {
        await client.post('EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: 'sms_house',
            DisplayName: label('House'),
            DisplayCollectionName: label('Houses'),
            Description: label('Boarding houses, day houses and class streams used to group students for welfare and competitions.'),
            OwnershipType: 'UserOwned',
            HasActivities: false,
            HasNotes: false,
            IsActivity: false,
            Attributes: [
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                    SchemaName: 'sms_name',
                    DisplayName: label('Name'),
                    RequiredLevel: reqLevel('ApplicationRequired'),
                    MaxLength: 200,
                    FormatName: { Value: 'Text' },
                    IsPrimaryName: true,
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
                    SchemaName: 'sms_type',
                    DisplayName: label('Type'),
                    RequiredLevel: reqLevel('ApplicationRequired'),
                    OptionSet: {
                        '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
                        IsGlobal: false,
                        OptionSetType: 'Picklist',
                        Options: [
                            { Value: 1, Label: label('Boarding House') },
                            { Value: 2, Label: label('Day House') },
                            { Value: 3, Label: label('Class Stream') },
                        ],
                    },
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                    SchemaName: 'sms_color',
                    DisplayName: label('Colour'),
                    RequiredLevel: reqLevel('None'),
                    MaxLength: 20,
                    FormatName: { Value: 'Text' },
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
                    SchemaName: 'sms_description',
                    DisplayName: label('Description'),
                    RequiredLevel: reqLevel('None'),
                    MaxLength: 2000,
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
                    SchemaName: 'sms_ordernumber',
                    DisplayName: label('Order Number'),
                    RequiredLevel: reqLevel('None'),
                    Format: 'None',
                    MinValue: 0,
                    MaxValue: 2147483647,
                },
            ],
        });
        console.log('   ✓ Entity created');
    } catch (e: any) {
        console.error('   ✗ Entity creation failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
        process.exit(1);
    }

    // ── 2. Verify entity + get EntitySetName ──
    const ent = await client.get(`EntityDefinitions(LogicalName='sms_house')?$select=LogicalName,EntitySetName,MetadataId`);
    console.log(`   EntitySetName = ${ent.data.EntitySetName}`);

    // ── 3. Create lookup relationships ──
    console.log('2. Creating lookup relationships');
    const lookups: { schema: string; refEntity: string; refAttr: string; lookupSchema: string; label: string }[] = [
        { schema: 'sms_house_sms_school', refEntity: 'sms_school', refAttr: 'sms_schoolid', lookupSchema: 'sms_school', label: 'School' },
    ];

    for (const lk of lookups) {
        try {
            await client.post('RelationshipDefinitions', {
                '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
                SchemaName: lk.schema,
                ReferencedEntity: lk.refEntity,
                ReferencingEntity: 'sms_house',
                ReferencedAttribute: lk.refAttr,
                Lookup: {
                    '@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
                    SchemaName: lk.lookupSchema,
                    DisplayName: label(lk.label),
                    RequiredLevel: reqLevel('None'),
                },
            });
            console.log(`   ✓ ${lk.lookupSchema} -> ${lk.refEntity}`);
        } catch (e: any) {
            console.error(`   ✗ ${lk.lookupSchema} -> ${lk.refEntity}: ${JSON.stringify(e.response?.data ?? e.message)?.slice(0, 300)}`);
        }
    }

    // ── 4. Publish customizations ──
    console.log('3. Publishing customizations (this may take a minute)');
    try {
        await client.post('PublishXml', {
            ParameterXml: '<importexportxml><entities><entity>sms_house</entity></entities></importexportxml>',
        });
        console.log('   ✓ Published');
    } catch (e: any) {
        console.error('   ✗ Publish failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
