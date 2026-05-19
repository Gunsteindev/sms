import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_students';

async function main() {
    const tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    const h = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };

    // Create a temp student
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await axios.post<any>(`${API}/${TABLE}`, {
        sms_name: 'PicTest', sms_firstname: 'Pic', sms_lastname: 'Test',
        sms_dateofbirth: '2010-01-01', sms_gender: 1, sms_enrollmentdate: '2024-01-01',
        sms_studentstatus: 1,
    }, { headers: { ...h, Prefer: 'return=representation' }, timeout: 20000 });
    const id = created.data.sms_studentid;
    console.log(`Created student: ${id}`);

    // Minimal 1×1 JPEG bytes
    const jpegBytes = Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
        'base64'
    );

    const contentTypes = ['image/jpeg', 'image/jpg', 'application/octet-stream'];
    for (const ct of contentTypes) {
        try {
            await axios.put(`${API}/${TABLE}(${id})/sms_profilepicture`, jpegBytes, {
                headers: { ...h, 'Content-Type': ct },
                maxBodyLength: Infinity, timeout: 20000,
            });
            console.log(`  ✓ Upload accepted with Content-Type: ${ct}`);
        } catch (e: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log(`  ✗ Upload rejected (${ct}): ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
        }
    }

    // Try download
    try {
        const r = await axios.get(`${API}/${TABLE}(${id})/sms_profilepicture/$value`,
            { headers: h, responseType: 'arraybuffer', timeout: 20000 });
        console.log(`  ✓ Download OK: ${(r.data as Buffer).length} bytes, content-type: ${r.headers['content-type']}`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`  ✗ Download failed: ${(e as any).response?.status}`);
    }

    // Cleanup
    await axios.delete(`${API}/${TABLE}(${id})`, { headers: h, timeout: 20000 });
    console.log('Cleaned up.');
}
main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any).response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
