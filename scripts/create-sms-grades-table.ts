/**
 * create-sms-grades-table.ts
 *
 * Task #11 (part 1) — create the sms_grade custom entity in Dataverse via the
 * Metadata API, matching the schema already coded in src/lib/dataverse/grades.ts:
 *   sms_name (primary), sms_assessmenttype (picklist 1-6), sms_score (decimal),
 *   sms_maxscore (decimal), sms_date (DateOnly), sms_remarks (memo)
 * plus lookups: sms_student, sms_subject, sms_class, sms_term, sms_academicyear,
 * sms_teacher, sms_school (all -> existing sms_* entities).
 *
 * Run: npx ts-node --skipProject scripts/create-sms-grades-table.ts
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
    console.log('  Create Dataverse table: sms_grade');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // ── 1. Create entity with primary name + simple attributes ──
    console.log('1. Creating entity sms_grade with attributes');
    try {
        await client.post('EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: 'sms_grade',
            DisplayName: label('Grade'),
            DisplayCollectionName: label('Grades'),
            Description: label('Gradebook entries for student assessments (classwork, homework, quizzes, exams, projects).'),
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
                    SchemaName: 'sms_assessmenttype',
                    DisplayName: label('Assessment Type'),
                    RequiredLevel: reqLevel('None'),
                    OptionSet: {
                        '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
                        IsGlobal: false,
                        OptionSetType: 'Picklist',
                        Options: [
                            { Value: 1, Label: label('Classwork') },
                            { Value: 2, Label: label('Homework') },
                            { Value: 3, Label: label('Quiz') },
                            { Value: 4, Label: label('MidTerm') },
                            { Value: 5, Label: label('End of Term') },
                            { Value: 6, Label: label('Project') },
                        ],
                    },
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata',
                    SchemaName: 'sms_score',
                    DisplayName: label('Score'),
                    RequiredLevel: reqLevel('None'),
                    Precision: 2,
                    MinValue: 0,
                    MaxValue: 1000,
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata',
                    SchemaName: 'sms_maxscore',
                    DisplayName: label('Max Score'),
                    RequiredLevel: reqLevel('None'),
                    Precision: 2,
                    MinValue: 0,
                    MaxValue: 1000,
                },
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
                    SchemaName: 'sms_date',
                    DisplayName: label('Date'),
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
    const ent = await client.get(`EntityDefinitions(LogicalName='sms_grade')?$select=LogicalName,EntitySetName,MetadataId`);
    console.log(`   EntitySetName = ${ent.data.EntitySetName}`);

    // ── 3. Create lookup relationships ──
    console.log('2. Creating lookup relationships');
    const lookups: { schema: string; refEntity: string; refAttr: string; lookupSchema: string; label: string }[] = [
        { schema: 'sms_grade_sms_student',      refEntity: 'sms_student',      refAttr: 'sms_studentid',      lookupSchema: 'sms_student',      label: 'Student' },
        { schema: 'sms_grade_sms_subject',      refEntity: 'sms_subject',      refAttr: 'sms_subjectid',      lookupSchema: 'sms_subject',      label: 'Subject' },
        { schema: 'sms_grade_sms_class',        refEntity: 'sms_class',        refAttr: 'sms_classid',        lookupSchema: 'sms_class',        label: 'Class' },
        { schema: 'sms_grade_sms_term',         refEntity: 'sms_term',         refAttr: 'sms_termid',         lookupSchema: 'sms_term',         label: 'Term' },
        { schema: 'sms_grade_sms_academicyear', refEntity: 'sms_academicyear', refAttr: 'sms_academicyearid', lookupSchema: 'sms_academicyear', label: 'Academic Year' },
        { schema: 'sms_grade_sms_teacher',      refEntity: 'sms_teacher',      refAttr: 'sms_teacherid',      lookupSchema: 'sms_teacher',      label: 'Teacher' },
        { schema: 'sms_grade_sms_school',       refEntity: 'sms_school',       refAttr: 'sms_schoolid',       lookupSchema: 'sms_school',       label: 'School' },
    ];

    for (const lk of lookups) {
        try {
            await client.post('RelationshipDefinitions', {
                '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
                SchemaName: lk.schema,
                ReferencedEntity: lk.refEntity,
                ReferencingEntity: 'sms_grade',
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
            ParameterXml: '<importexportxml><entities><entity>sms_grade</entity></entities></importexportxml>',
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
