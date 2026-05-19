import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    const fields = ['sms_gender', 'sms_studentstatus', 'sms_enrollmentstatus', 'sms_specialneeds'];

    for (const field of fields) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = await axios.get<any>(
                `${API}/EntityDefinitions(LogicalName='sms_student')/Attributes(LogicalName='${field}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,AttributeType&$expand=OptionSet($select=Options)`,
                { headers: h, timeout: 20000 }
            );
            console.log(`\n${field} (${r.data.AttributeType ?? 'Picklist'}):`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            r.data.OptionSet?.Options?.forEach((o: any) =>
                console.log(`  ${o.Value}: ${o.Label?.UserLocalizedLabel?.Label ?? o.Label?.LocalizedLabels?.[0]?.Label}`)
            );
        } catch {
            // Try as BooleanAttribute (for specialneeds)
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r2 = await axios.get<any>(
                    `${API}/EntityDefinitions(LogicalName='sms_student')/Attributes(LogicalName='${field}')/Microsoft.Dynamics.CRM.BooleanAttributeMetadata?$select=LogicalName,AttributeType&$expand=OptionSet($select=TrueOption,FalseOption)`,
                    { headers: h, timeout: 20000 }
                );
                console.log(`\n${field} (Boolean):`);
                const os = r2.data.OptionSet;
                console.log(`  ${os?.TrueOption?.Value}: ${os?.TrueOption?.Label?.UserLocalizedLabel?.Label}`);
                console.log(`  ${os?.FalseOption?.Value}: ${os?.FalseOption?.Label?.UserLocalizedLabel?.Label}`);
            } catch (e2) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.log(`\n${field}: could not inspect (${(e2 as any).response?.status})`);
            }
        }
    }

    // Also fetch one real student record to see actual returned values
    console.log('\n── Sample student record ──');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = await axios.get<any>(
        `${API}/sms_students?$select=sms_firstname,sms_lastname,sms_gender,sms_studentstatus,sms_enrollmentstatus&$top=3`,
        { headers: { ...h, Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' }, timeout: 20000 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.data.value?.forEach((s: any) => {
        console.log(`  ${s.sms_firstname} ${s.sms_lastname}:`);
        console.log(`    gender=${s.sms_gender}  status=${s.sms_studentstatus}  enroll=${s.sms_enrollmentstatus}`);
        console.log(`    gender_label="${s['sms_gender@OData.Community.Display.V1.FormattedValue']}"  status_label="${s['sms_studentstatus@OData.Community.Display.V1.FormattedValue']}"  enroll_label="${s['sms_enrollmentstatus@OData.Community.Display.V1.FormattedValue']}"`);
    });
}
main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any).response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
