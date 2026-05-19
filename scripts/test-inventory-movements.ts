import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_inventorymovements';

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

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.log(`  ✗ ${msg}`); }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMsg(e: unknown) { return (e as any).response?.data?.error?.message ?? (e as Error).message; }

async function main() {
    await getToken();
    console.log('Token OK\n');

    // ── 0. Get a school ID ────────────────────────────────────────────────────
    console.log('0. Fetch a school to use for binding');
    let schoolId: string | null = null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        const s = r.data.value?.[0];
        if (s) { schoolId = s.sms_schoolid; pass(`School: "${s.sms_name}" (${schoolId})`); }
        else   { fail('No schools found — skipping write tests'); }
    } catch (e) { fail(`Fetch schools failed: ${errMsg(e)}`); }

    // ── 1. Get a real inventory item to reference ─────────────────────────────
    console.log('\n1. Fetch an inventory item');
    let itemId: string | null = null;
    let itemName = '';
    let itemQty = 0;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/sms_inventoryitems?$select=sms_inventoryitemid,sms_name,sms_quantity&$top=1`,
            { headers: h, timeout: 20000 }
        );
        const item = r.data.value?.[0];
        if (item) {
            itemId   = item.sms_inventoryitemid;
            itemName = item.sms_name ?? '';
            itemQty  = item.sms_quantity ?? 0;
            pass(`Item: "${itemName}"  current qty=${itemQty}  id=${itemId}`);
        } else {
            fail('No inventory items found — write tests will use a placeholder ID');
            itemId = '00000000-0000-0000-0000-000000000000';
        }
    } catch (e) { fail(`Fetch items failed: ${errMsg(e)}`); itemId = '00000000-0000-0000-0000-000000000000'; }

    // ── 2. List existing movements (proves table exists) ──────────────────────
    console.log('\n2. List movements (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_inventorymovementid,sms_name,sms_itemname,sms_movementtype,sms_quantity&$top=5&$orderby=createdon desc`,
            { headers: h, timeout: 20000 }
        );
        const rows = r.data.value ?? [];
        pass(`Table reachable — ${rows.length} recent movement(s) returned`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((m: any) => {
            const typeLabel = ['','Stock In','Stock Out','Adjustment','Loss/Damage','Return'][m.sms_movementtype] ?? m.sms_movementtype;
            console.log(`     "${m.sms_itemname}"  type=${typeLabel}  qty=${m.sms_quantity}  id=${m.sms_inventorymovementid}`);
        });
    } catch (e) { fail(`List failed: ${errMsg(e)}`); return; }

    if (!schoolId) { console.log('\nNo school found — skipping create/update/delete tests.'); return; }

    // ── 3. Create a movement ──────────────────────────────────────────────────
    console.log('\n3. Create a test movement (Stock In, qty=5)');
    let createdId: string | null = null;
    try {
        const payload: Record<string, unknown> = {
            sms_name:           `TEST-MOV-${Date.now()}`,
            sms_itemid:         itemId,
            sms_itemname:       itemName || 'Test Item',
            sms_movementtype:   1,
            sms_quantity:       5,
            sms_quantitybefore: itemQty,
            sms_quantityafter:  itemQty + 5,
            sms_reason:         'API test',
            sms_movedby:        'test-script',
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${TABLE}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = r.data?.sms_inventorymovementid;
        pass(`Created movement  id=${createdId}`);
        console.log(`     sms_name=${r.data?.sms_name}  movementtype=${r.data?.sms_movementtype}  qty=${r.data?.sms_quantity}`);
    } catch (e) { fail(`Create failed: ${errMsg(e)}`); }

    if (!createdId) { console.log('\nSkipping read/delete — no movement created.'); return; }

    // ── 4. Read it back ───────────────────────────────────────────────────────
    console.log('\n4. Read movement by ID');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=sms_inventorymovementid,sms_name,sms_itemname,sms_movementtype,sms_quantity,sms_quantitybefore,sms_quantityafter,sms_reason,sms_movedby`,
            { headers: h, timeout: 20000 }
        );
        pass('Read OK');
        console.log(`     itemname=${r.data.sms_itemname}  type=${r.data.sms_movementtype}  qty=${r.data.sms_quantity}  before=${r.data.sms_quantitybefore}  after=${r.data.sms_quantityafter}`);
        console.log(`     reason="${r.data.sms_reason}"  movedby="${r.data.sms_movedby}"`);
    } catch (e) { fail(`Read failed: ${errMsg(e)}`); }

    // ── 5. Filter by item ─────────────────────────────────────────────────────
    console.log('\n5. List movements filtered by item');
    try {
        const filter = encodeURIComponent(`sms_itemid eq '${itemId}'`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_inventorymovementid,sms_movementtype,sms_quantity&$filter=${filter}&$top=10`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter by itemid returned ${r.data.value?.length ?? 0} row(s)`);
    } catch (e) { fail(`Filter failed: ${errMsg(e)}`); }

    // ── 6. Delete test record ─────────────────────────────────────────────────
    console.log('\n6. Delete test movement');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass(`Deleted ${createdId}`);
    } catch (e) { fail(`Delete failed: ${errMsg(e)}`); }

    console.log('\nDone.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
