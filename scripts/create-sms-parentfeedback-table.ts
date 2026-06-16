/**
 * create-sms-parentfeedback-table.ts
 *
 * Creates the sms_parentfeedback custom entity in Dataverse for the parent portal
 * feedback & complaints feature, matching src/lib/dataverse/parentFeedback.ts:
 *   sms_name (primary = subject), sms_feedbacktype (Whole Number),
 *   sms_message (Memo), sms_status (Whole Number), sms_response (Memo),
 *   sms_submittedby (Text)
 * plus lookups: sms_parent, sms_student, sms_school.
 *
 * Run: npx ts-node --skipProject scripts/create-sms-parentfeedback-table.ts
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
    SchemaName: schemaName, DisplayName: label(displayName), RequiredLevel: reqLevel('None'), MaxLength: 4000,
});
const stringAttr = (schemaName: string, displayName: string, maxLength: number) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
    SchemaName: schemaName, DisplayName: label(displayName), RequiredLevel: reqLevel('None'), MaxLength: maxLength,
    FormatName: { Value: 'Text' },
});
const intAttr = (schemaName: string, displayName: string) => ({
    '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
    SchemaName: schemaName, DisplayName: label(displayName), RequiredLevel: reqLevel('None'),
    MinValue: 0, MaxValue: 1000000, Format: 'None',
});

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Create Dataverse table: sms_parentfeedback');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    console.log('1. Creating entity sms_parentfeedback with attributes');
    try {
        await client.post('EntityDefinitions', {
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            SchemaName: 'sms_parentfeedback',
            EntitySetName: 'sms_parentfeedbacks',
            DisplayName: label('Parent Feedback'),
            DisplayCollectionName: label('Parent Feedback'),
            Description: label('Feedback, complaints, suggestions and questions submitted by parents via the parent portal.'),
            OwnershipType: 'UserOwned',
            HasActivities: false, HasNotes: false, IsActivity: false,
            Attributes: [
                {
                    '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
                    SchemaName: 'sms_name', DisplayName: label('Subject'),
                    RequiredLevel: reqLevel('ApplicationRequired'), MaxLength: 250,
                    FormatName: { Value: 'Text' }, IsPrimaryName: true,
                },
                intAttr('sms_feedbacktype', 'Feedback Type'),  // 1=Feedback 2=Complaint 3=Suggestion 4=Question
                memoAttr('sms_message', 'Message'),
                intAttr('sms_status', 'Status'),               // 1=Submitted 2=In Review 3=Resolved
                memoAttr('sms_response', 'Response'),
                stringAttr('sms_submittedby', 'Submitted By', 200),
            ],
        });
        console.log('   ✓ Entity created');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        const msg = JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500);
        if (msg?.includes('already exists') || e.response?.status === 412) {
            console.log('   ⚬ Entity already exists — continuing');
        } else {
            console.error('   ✗ Entity creation failed:', msg); process.exit(1);
        }
    }

    const ent = await client.get(`EntityDefinitions(LogicalName='sms_parentfeedback')?$select=LogicalName,EntitySetName`);
    console.log(`   EntitySetName = ${ent.data.EntitySetName}`);

    console.log('2. Creating lookup relationships');
    const lookups = [
        { schema: 'sms_parentfeedback_sms_parent',  refEntity: 'sms_parent',  refAttr: 'sms_parentid',  lookupSchema: 'sms_parent',  label: 'Parent' },
        { schema: 'sms_parentfeedback_sms_student', refEntity: 'sms_student', refAttr: 'sms_studentid', lookupSchema: 'sms_student', label: 'Student' },
        { schema: 'sms_parentfeedback_sms_school',  refEntity: 'sms_school',  refAttr: 'sms_schoolid',  lookupSchema: 'sms_school',  label: 'School' },
    ];
    for (const lk of lookups) {
        try {
            await client.post('RelationshipDefinitions', {
                '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
                SchemaName: lk.schema,
                ReferencedEntity: lk.refEntity,
                ReferencingEntity: 'sms_parentfeedback',
                ReferencedAttribute: lk.refAttr,
                Lookup: {
                    '@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
                    SchemaName: lk.lookupSchema, DisplayName: label(lk.label), RequiredLevel: reqLevel('None'),
                },
            });
            console.log(`   ✓ ${lk.lookupSchema} -> ${lk.refEntity}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            const m = JSON.stringify(e.response?.data ?? e.message)?.slice(0, 200);
            console.error(`   ${m?.includes('already') ? '⚬ exists' : '✗'} ${lk.lookupSchema}: ${m}`);
        }
    }

    console.log('3. Publishing customizations (this may take a minute)');
    try {
        await client.post('PublishXml', {
            ParameterXml: '<importexportxml><entities><entity>sms_parentfeedback</entity></entities></importexportxml>',
        });
        console.log('   ✓ Published');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error('   ✗ Publish failed:', JSON.stringify(e.response?.data ?? e.message)?.slice(0, 500));
    }

    try {
        await client.get(`sms_parentfeedbacks?$top=1`);
        console.log(`\n   ✓ GET sms_parentfeedbacks?$top=1 works`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(`\n   ✗ probe failed: ${JSON.stringify(e.response?.data ?? e.message)?.slice(0, 300)}`);
    }

    console.log('\n  Done.\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
