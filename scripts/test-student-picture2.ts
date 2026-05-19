import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_students';

// 1×1 JPEG bytes (minimal valid JPEG)
const JPEG = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
    'base64'
);

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    // ── Inspect column metadata ───────────────────────────────────────────────
    console.log('── sms_profilepicture attribute metadata ──');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/EntityDefinitions(LogicalName='sms_student')/Attributes(LogicalName='sms_profilepicture')?$select=LogicalName,AttributeType,AttributeTypeName`,
            { headers: h, timeout: 20000 }
        );
        console.log('  AttributeType:', r.data.AttributeType);
        console.log('  AttributeTypeName:', JSON.stringify(r.data.AttributeTypeName));
        console.log('  Full data:', JSON.stringify(r.data, null, 2).slice(0, 600));
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('  Error:', (e as any).response?.data?.error?.message ?? (e as Error).message);
    }

    // ── Create temp student ───────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await axios.post<any>(`${API}/${TABLE}`, {
        sms_name: 'PicTest2', sms_firstname: 'Pic', sms_lastname: 'Test2',
        sms_dateofbirth: '2010-01-01', sms_gender: 1, sms_enrollmentdate: '2024-01-01',
        sms_studentstatus: 1, sms_enrollmentstatus: 922330000,
    }, { headers: { ...h, Prefer: 'return=representation' }, timeout: 20000 });
    const id = created.data.sms_studentid;
    console.log(`\nCreated student: ${id}`);

    // ── Attempt 1: PUT to /$value endpoint ───────────────────────────────────
    console.log('\nAttempt 1: PUT sms_profilepicture/$value with image/jpeg');
    try {
        const r = await axios.put(`${API}/${TABLE}(${id})/sms_profilepicture/$value`, JPEG, {
            headers: { ...h, 'Content-Type': 'image/jpeg' },
            maxBodyLength: Infinity, timeout: 20000,
        });
        console.log('  ✓ Accepted — status:', r.status);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = e as any;
        console.log(`  ✗ ${err.response?.status}: ${err.response?.data?.error?.message ?? err.message}`);
    }

    // ── Attempt 2: PATCH with base64 in JSON ─────────────────────────────────
    console.log('\nAttempt 2: PATCH with base64 JSON body');
    try {
        const b64 = JPEG.toString('base64');
        const r = await axios.patch(`${API}/${TABLE}(${id})`, { sms_profilepicture: b64 }, {
            headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000,
        });
        console.log('  ✓ Accepted — status:', r.status);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = e as any;
        console.log(`  ✗ ${err.response?.status}: ${err.response?.data?.error?.message ?? err.message}`);
    }

    // ── Attempt 3: PATCH with data URL ───────────────────────────────────────
    console.log('\nAttempt 3: PATCH with data URL');
    try {
        const dataUrl = `data:image/jpeg;base64,${JPEG.toString('base64')}`;
        await axios.patch(`${API}/${TABLE}(${id})`, { sms_profilepicture: dataUrl }, {
            headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000,
        });
        console.log('  ✓ Accepted');
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = e as any;
        console.log(`  ✗ ${err.response?.status}: ${err.response?.data?.error?.message ?? err.message}`);
    }

    // ── Attempt 4: GET $value to check current state ──────────────────────────
    console.log('\nGET sms_profilepicture/$value (check current state):');
    try {
        const r = await axios.get(`${API}/${TABLE}(${id})/sms_profilepicture/$value`,
            { headers: h, responseType: 'arraybuffer', timeout: 20000, validateStatus: () => true });
        console.log(`  status=${r.status}  bytes=${(r.data as Buffer).length}  content-type=${r.headers['content-type']}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`  Error: ${(e as Error).message}`);
    }

    // ── Attempt 5: GET without /$value ────────────────────────────────────────
    console.log('\nGET sms_profilepicture (no $value):');
    try {
        const r = await axios.get(`${API}/${TABLE}(${id})/sms_profilepicture`,
            { headers: h, timeout: 20000, validateStatus: () => true });
        console.log(`  status=${r.status}  data=${JSON.stringify(r.data).slice(0, 200)}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`  Error: ${(e as Error).message}`);
    }

    // ── Attempt 6: GET entity with $select including picture ──────────────────
    console.log('\nGET entity with sms_profilepicture in $select:');
    try {
        const r = await axios.get(`${API}/${TABLE}(${id})?$select=sms_studentid,sms_profilepicture`,
            { headers: h, timeout: 20000, validateStatus: () => true });
        console.log(`  status=${r.status}  data=${JSON.stringify(r.data).slice(0, 300)}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`  Error: ${(e as Error).message}`);
    }

    // Cleanup
    await axios.delete(`${API}/${TABLE}(${id})`, { headers: h, timeout: 20000 });
    console.log('\nCleaned up.');
}
main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any).response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
