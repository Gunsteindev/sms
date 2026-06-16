/**
 * backfill-parent-names.ts
 *
 * sms_parents.sms_name (the primary name attribute) was never set by createParent/
 * updateParent, so existing parent records have sms_name = null. This breaks the
 * _sms_parent_value formatted-value lookup shown on student records. Backfills
 * sms_name = "<firstname> <lastname>" for every sms_parents record missing it.
 *
 * Run: npx ts-node --skipProject scripts/backfill-parent-names.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    );
    return res.data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        timeout: 30_000,
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
        },
    });
}

async function getAll<T>(client: AxiosInstance, url: string): Promise<T[]> {
    const rows: T[] = [];
    let next: string | undefined = url;
    while (next) {
        const res: { data: { value: T[]; '@odata.nextLink'?: string } } = await client.get(next);
        rows.push(...res.data.value);
        next = res.data['@odata.nextLink'];
    }
    return rows;
}

async function main() {
    if (!T || !C || !S || !D) {
        console.error('Missing required env vars');
        process.exit(1);
    }

    console.log('Obtaining access token…');
    const token  = await getToken();
    const client = makeClient(token);

    const parents = await getAll<Record<string, unknown>>(
        client,
        `sms_parents?$select=sms_parentid,sms_name,sms_firstname,sms_lastname`,
    );

    const missing = parents.filter(p => !p.sms_name);
    console.log(`Found ${parents.length} parent(s), ${missing.length} missing sms_name\n`);

    let ok = 0, fail = 0;
    for (const p of missing) {
        const id   = p.sms_parentid as string;
        const name = `${p.sms_firstname ?? ''} ${p.sms_lastname ?? ''}`.trim();
        try {
            await client.patch(`sms_parents(${id})`, { sms_name: name }, { headers: { 'If-Match': '*' } });
            console.log(`  ✓ ${id} → "${name}"`);
            ok++;
        } catch (err: unknown) {
            const e = err as { response?: { data?: unknown }; message?: string };
            console.error(`  ✗ ${id}:`, e.response?.data ?? e.message);
            fail++;
        }
    }

    console.log(`\nDone. ${ok} updated, ${fail} failed.`);
}

main().catch(e => { console.error(e); process.exit(1); });
