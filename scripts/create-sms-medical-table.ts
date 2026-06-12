/**
 * create-sms-medical-table.ts
 *
 * Task #13 (part 1) — create the sms_medical custom entity in Dataverse via
 * the Metadata API, matching the schema already coded in
 * src/lib/dataverse/medical.ts:
 *   sms_name (primary), sms_bloodtype, sms_allergies, sms_chronicconditions,
 *   sms_currentmedications, sms_vaccinationrecords (all Memo except bloodtype),
 *   sms_lastcheckupdate (DateOnly), sms_emergencycontact, sms_emergencyphone
 * plus lookups: sms_student, sms_school.
 *
 * medical.ts hardcodes TABLE = 'sms_medical' (singular). We explicitly request
 * EntitySetName: 'sms_medical' so the existing code works unmodified — if
 * Dataverse ignores that and defaults to 'sms_medicals', this script will
 * report the actual EntitySetName so medical.ts's TABLE constant can be
 * updated to match.
 *
 * Run: npx ts-node --skipProject scripts/create-sms-medical-table.ts
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

const memoAttr = (schemaName: string, displayName: string) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
    SchemaName: schemaName,
    DisplayName: label(displayName),
    RequiredLevel: reqLevel('None'),
    MaxLength: 2000,
});

const stringAttr = (schemaName: string, displayName: string, maxLength: number) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
    SchemaName: schemaName,
    DisplayName: label(displayName),
    RequiredLevel: reqLevel('None'),
    MaxLength: maxLength,
    FormatName: { Value: 'Text' },
});

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Create Dataverse table: sms_medical');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // ── 1. Create entity with primary name + simple attributes ──
    console.log('1. Creating entity sms_medical with attributes');
    try {
        await client.post('EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: 'sms_medical',
            EntitySetName: 'sms_medical',
            DisplayName: label('Medical Record'),
            DisplayCollectionName: label('Medical Records'),
            Description: label('Student medical records: blood type, allergies, chronic conditions, medications, vaccinations, and emergency contacts.'),
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
                stringAttr('sms_bloodtype', 'Blood Type', 10),
                memoAttr('sms_allergies', 'Allergies'),
                memoAttr('sms_chronicconditions', 'Chronic Conditions'),
                memoAttr('sms_currentmedications', 'Current Medications'),
                memoAttr('sms_vaccinationrecords', 'Vaccination Records'),
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
                    SchemaName: 'sms_lastcheckupdate',
                    DisplayName: label('Last Checkup Date'),
                    RequiredLevel: reqLevel('None'),
                    Format: 'DateOnly',
                },
                stringAttr('sms_emergencycontact', 'Emergency Contact', 200),
                stringAttr('sms_emergencyphone', 'Emergency Phone', 30),
            ],
        });
        console.log('   ✓ Entity created');
    } catch (e: any) {
        console.error('   ✗ Entity creation failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
        process.exit(1);
    }

    // ── 2. Verify entity + get EntitySetName ──
    const ent = await client.get(`EntityDefinitions(LogicalName='sms_medical')?$select=LogicalName,EntitySetName,MetadataId`);
    console.log(`   EntitySetName = ${ent.data.EntitySetName}`);

    // ── 3. Create lookup relationships ──
    console.log('2. Creating lookup relationships');
    const lookups: { schema: string; refEntity: string; refAttr: string; lookupSchema: string; label: string }[] = [
        { schema: 'sms_medical_sms_student', refEntity: 'sms_student', refAttr: 'sms_studentid', lookupSchema: 'sms_student', label: 'Student' },
        { schema: 'sms_medical_sms_school',  refEntity: 'sms_school',  refAttr: 'sms_schoolid',  lookupSchema: 'sms_school',  label: 'School' },
    ];

    for (const lk of lookups) {
        try {
            await client.post('RelationshipDefinitions', {
                '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
                SchemaName: lk.schema,
                ReferencedEntity: lk.refEntity,
                ReferencingEntity: 'sms_medical',
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
            ParameterXml: '<importexportxml><entities><entity>sms_medical</entity></entities></importexportxml>',
        });
        console.log('   ✓ Published');
    } catch (e: any) {
        console.error('   ✗ Publish failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
    }

    // ── 5. Confirm queryable at the path medical.ts expects ──
    try {
        const probe = await client.get(`sms_medical?$top=1`);
        console.log(`\n   ✓ GET sms_medical?$top=1 works -> ${JSON.stringify(probe.data['@odata.context'])}`);
    } catch (e: any) {
        console.error(`\n   ✗ GET sms_medical?$top=1 failed: ${JSON.stringify(e.response?.data ?? e.message)?.slice(0, 300)}`);
        console.error(`   -> medical.ts TABLE constant may need updating to '${ent.data.EntitySetName}'`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
