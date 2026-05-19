import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_students';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tok: string; let h: any;

async function getToken() {
    tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    h = {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
}

const SELECT = 'sms_studentid,sms_firstname,sms_lastname,sms_name,sms_gender,sms_studentstatus,sms_enrollmentstatus,sms_dateofbirth,sms_enrollmentdate,sms_email,sms_phone,sms_studentnumber';

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.log(`  ✗ ${msg}`); }

async function main() {
    await getToken();
    console.log('Token OK\n');

    let createdId: string | null = null;

    // ── 1. List students ──────────────────────────────────────────────────────
    console.log('1. List students (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/${TABLE}?$select=${SELECT}&$top=5&$count=true`, { headers: h, timeout: 20000 });
        const count = r.data['@odata.count'] ?? r.data.value?.length;
        pass(`Found ${count} students total. First 5 names:`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.data.value?.forEach((s: any) => {
            console.log(`     ${s.sms_firstname} ${s.sms_lastname}  gender=${s.sms_gender}  status=${s.sms_studentstatus}  enroll=${s.sms_enrollmentstatus}`);
        });
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`List failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    // ── 2. Create student ─────────────────────────────────────────────────────
    console.log('\n2. Create student');
    try {
        const payload = {
            sms_name:           'Test Student',
            sms_firstname:      'Test',
            sms_lastname:       'Student',
            sms_dateofbirth:    '2010-01-15',
            sms_gender:         1,
            sms_enrollmentdate: '2024-09-01',
            sms_studentstatus:  1,
            sms_enrollmentstatus: 922330000,
            sms_studentnumber:  'TEST-001',
        };
        const r = await axios.post(`${API}/${TABLE}`, payload, {
            headers: { ...h, Prefer: 'return=representation,odata.include-annotations="OData.Community.Display.V1.FormattedValue"' },
            timeout: 20000,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdId = (r.data as any).sms_studentid;
        pass(`Created: id=${createdId}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Create failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    if (!createdId) { console.log('\nSkipping remaining tests — no student created.'); return; }

    // ── 3. Read student ───────────────────────────────────────────────────────
    console.log('\n3. Read student');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/${TABLE}(${createdId})?$select=${SELECT}`, { headers: h, timeout: 20000 });
        pass(`Read OK: ${r.data.sms_firstname} ${r.data.sms_lastname}`);
        console.log(`     gender=${r.data.sms_gender}  status=${r.data.sms_studentstatus}  enroll=${r.data.sms_enrollmentstatus}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Read failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    // ── 4. Update student ─────────────────────────────────────────────────────
    console.log('\n4. Update student (change status to Graduated=2)');
    try {
        await axios.patch(`${API}/${TABLE}(${createdId})`, {
            sms_studentstatus: 2,
            sms_phone: '+233 20 111 1111',
        }, { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 });
        pass('Update OK');
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Update failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    // ── 5. Update enrollmentstatus ────────────────────────────────────────────
    console.log('\n5. Test enrollmentstatus values');
    for (const v of [922330000, 922330001, 922330002, 922330003, 1, 2, 3]) {
        try {
            await axios.patch(`${API}/${TABLE}(${createdId})`, { sms_enrollmentstatus: v },
                { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 10000 });
            pass(`enrollmentstatus=${v} accepted`);
        } catch (e: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fail(`enrollmentstatus=${v} rejected: ${(e as any).response?.data?.error?.message}`);
        }
    }

    // ── 6. Test studentstatus values ──────────────────────────────────────────
    console.log('\n6. Test studentstatus values');
    for (const v of [1, 2, 3, 4, 922330000]) {
        try {
            await axios.patch(`${API}/${TABLE}(${createdId})`, { sms_studentstatus: v },
                { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 10000 });
            pass(`studentstatus=${v} accepted`);
        } catch (e: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fail(`studentstatus=${v} rejected: ${(e as any).response?.data?.error?.message}`);
        }
    }

    // ── 7. Upload picture ─────────────────────────────────────────────────────
    console.log('\n7. Upload profile picture');
    try {
        // 1x1 transparent PNG as test
        const pngBytes = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );
        await axios.put(`${API}/${TABLE}(${createdId})/sms_profilepicture`, pngBytes, {
            headers: { ...h, 'Content-Type': 'image/png' },
            maxBodyLength: Infinity,
            timeout: 20000,
        });
        pass('Picture upload OK');
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Picture upload failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    // ── 8. Download picture ───────────────────────────────────────────────────
    console.log('\n8. Download profile picture');
    try {
        const r = await axios.get(`${API}/${TABLE}(${createdId})/sms_profilepicture/$value`,
            { headers: h, responseType: 'arraybuffer', timeout: 20000 });
        pass(`Picture download OK — ${(r.data as Buffer).length} bytes`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Picture download failed: ${(e as any).response?.status} ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    // ── 9. Delete student ─────────────────────────────────────────────────────
    console.log('\n9. Delete student');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass('Deleted OK');
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fail(`Delete failed: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
    }

    console.log('\nDone.');
}
main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any).response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
