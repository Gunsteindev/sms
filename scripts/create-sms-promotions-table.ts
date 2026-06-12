/**
 * create-sms-promotions-table.ts
 *
 * Task #12 (part 1) — create the sms_promotion custom entity in Dataverse via
 * the Metadata API, matching the schema already coded in
 * src/lib/dataverse/promotions.ts:
 *   sms_name (primary), sms_status (picklist 1-4), sms_promotiondate (DateOnly),
 *   sms_remarks (memo)
 * plus lookups: sms_student, sms_fromgradelevel, sms_togradelevel,
 * sms_fromclass, sms_toclass, sms_academicyear, sms_school.
 *
 * Run: npx ts-node --skipProject scripts/create-sms-promotions-table.ts
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
    console.log('  Create Dataverse table: sms_promotion');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // ── 1. Create entity with primary name + simple attributes ──
    console.log('1. Creating entity sms_promotion with attributes');
    try {
        await client.post('EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: 'sms_promotion',
            DisplayName: label('Promotion'),
            DisplayCollectionName: label('Promotions'),
            Description: label('Year-end promotion / retention / transfer / graduation records for students.'),
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
                    SchemaName: 'sms_status',
                    DisplayName: label('Status'),
                    RequiredLevel: reqLevel('None'),
                    OptionSet: {
                        '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
                        IsGlobal: false,
                        OptionSetType: 'Picklist',
                        Options: [
                            { Value: 1, Label: label('Promoted') },
                            { Value: 2, Label: label('Retained') },
                            { Value: 3, Label: label('Transferred') },
                            { Value: 4, Label: label('Graduated') },
                        ],
                    },
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
                    SchemaName: 'sms_promotiondate',
                    DisplayName: label('Promotion Date'),
                    RequiredLevel: reqLevel('None'),
                    Format: 'DateOnly',
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
                    SchemaName: 'sms_remarks',
                    DisplayName: label('Remarks'),
                    RequiredLevel: reqLevel('None'),
                    MaxLength: 2000,
                },
            ],
        });
        console.log('   ✓ Entity created');
    } catch (e: any) {
        console.error('   ✗ Entity creation failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
        process.exit(1);
    }

    // ── 2. Verify entity + get EntitySetName ──
    const ent = await client.get(`EntityDefinitions(LogicalName='sms_promotion')?$select=LogicalName,EntitySetName,MetadataId`);
    console.log(`   EntitySetName = ${ent.data.EntitySetName}`);

    // ── 3. Create lookup relationships ──
    console.log('2. Creating lookup relationships');
    const lookups: { schema: string; refEntity: string; refAttr: string; lookupSchema: string; label: string }[] = [
        { schema: 'sms_promotion_sms_student',       refEntity: 'sms_student',      refAttr: 'sms_studentid',      lookupSchema: 'sms_student',       label: 'Student' },
        { schema: 'sms_promotion_sms_fromgradelevel', refEntity: 'sms_gradelevel',   refAttr: 'sms_gradelevelid',   lookupSchema: 'sms_fromgradelevel', label: 'From Grade Level' },
        { schema: 'sms_promotion_sms_togradelevel',   refEntity: 'sms_gradelevel',   refAttr: 'sms_gradelevelid',   lookupSchema: 'sms_togradelevel',   label: 'To Grade Level' },
        { schema: 'sms_promotion_sms_fromclass',      refEntity: 'sms_class',        refAttr: 'sms_classid',        lookupSchema: 'sms_fromclass',      label: 'From Class' },
        { schema: 'sms_promotion_sms_toclass',        refEntity: 'sms_class',        refAttr: 'sms_classid',        lookupSchema: 'sms_toclass',        label: 'To Class' },
        { schema: 'sms_promotion_sms_academicyear',   refEntity: 'sms_academicyear', refAttr: 'sms_academicyearid', lookupSchema: 'sms_academicyear',   label: 'Academic Year' },
        { schema: 'sms_promotion_sms_school',         refEntity: 'sms_school',       refAttr: 'sms_schoolid',       lookupSchema: 'sms_school',         label: 'School' },
    ];

    for (const lk of lookups) {
        try {
            await client.post('RelationshipDefinitions', {
                '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
                SchemaName: lk.schema,
                ReferencedEntity: lk.refEntity,
                ReferencingEntity: 'sms_promotion',
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
            ParameterXml: '<importexportxml><entities><entity>sms_promotion</entity></entities></importexportxml>',
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
