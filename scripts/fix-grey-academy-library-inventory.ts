/**
 * fix-grey-academy-library-inventory.ts
 *
 * Task #8 — fix Grey Academy's Library Loans links and seed Inventory
 * Movements.
 *
 * 1. Library:
 *    - "LN-NOBIND" has no book/student/borrowertype link (created without
 *      @odata.bind). Renamed to "LN-2026-019", linked to "Social Studies –
 *      Basic Education" + a JHS student, marked Overdue (duedate already
 *      passed with no return).
 *    - All 22 sms_librarybooks have sms_totalcopies/sms_availablecopies =
 *      null. Set realistic copy counts, with availablecopies reduced by the
 *      number of currently active (Issued/Overdue) loans for that book.
 *
 * 2. Inventory: only 1 sms_inventorymovements record exists total (A4 paper
 *    Stock Out 45->0). Seed a Stock In (+ Stock Out/Loss for consumables)
 *    history for all 39 items so quantityafter matches each item's current
 *    sms_quantity.
 *
 * Run: npx ts-node --skipProject scripts/fix-grey-academy-library-inventory.ts
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

const GREY_ACADEMY_ID = '3a5c5d93-b948-f111-bec6-7ced8d6e6816';

// ── Library ──
const LN_NOBIND_ID = '8217530f-fb3e-f111-bec6-70a8a59a431e';
const BOOK_SOCIAL_STUDIES = 'b1d1a9c5-ff3e-f111-bec6-70a8a59a431e';
const STUDENT_COURAGE_ACHEAMPONG = 'c7fca0b4-c03f-f111-bec6-70a8a59a431e';

// bookId -> { total, available } — available reduced by active (Issued/Overdue) loans
const BOOK_COPIES: Record<string, { total: number; available: number }> = {
    'aed1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 10, available: 8 },  // Mathematics for Secondary School
    'afd1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 10, available: 10 }, // English Language and Literature
    'b0d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 8,  available: 7 },  // Integrated Science – Junior High
    'b1d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 8,  available: 7 },  // Social Studies – Basic Education
    'b2d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 6 },  // Information & Communication Tech
    'b3d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 6 },  // French for Beginners
    'b4d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 6 },  // Physical Education and Health
    'b5d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 6 },  // Religious and Moral Education
    'b6d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 6 },  // History of Ghana
    'b8d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 3,  available: 2 },  // Oxford English Dictionary
    'b9d1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 2,  available: 1 },  // Encyclopedia Britannica Vol. 1–5
    'bad1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 3,  available: 3 },  // Atlas of the World – 2024 Edition
    'bbd1a9c5-ff3e-f111-bec6-70a8a59a431e': { total: 4,  available: 4 },  // Cambridge Grammar of English
    '0a2c74cc-ff3e-f111-bec6-70a8a59a431e': { total: 4,  available: 4 },  // Dictionary of Science Terms
    '0b2c74cc-ff3e-f111-bec6-70a8a59a431e': { total: 3,  available: 3 },  // Who's Who in African History
    '0c2c74cc-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 5 },  // Things Fall Apart
    'c6a769e9-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 5 },  // Animal Farm
    'c7a769e9-ff3e-f111-bec6-70a8a59a431e': { total: 5,  available: 4 },  // Half of a Yellow Sun
    'c8a769e9-ff3e-f111-bec6-70a8a59a431e': { total: 5,  available: 4 },  // Arrow of God
    'c9a769e9-ff3e-f111-bec6-70a8a59a431e': { total: 5,  available: 4 },  // The Beautyful Ones Are Not Yet Born
    'caa769e9-ff3e-f111-bec6-70a8a59a431e': { total: 6,  available: 5 },  // Weep Not, Child
    'da9d3855-043f-f111-bec6-70a8a59a431e': { total: 5,  available: 5 },  // The Old Man and the Sea
};

// ── Inventory ──
interface ItemFlow {
    id: string;
    current: number;
    initial: number;
    outType?: number; // 2=Stock Out, 4=Loss/Damage
    outBy?: string;
    outReason?: string;
}

const INVENTORY_FLOWS: ItemFlow[] = [
    // Cleaning
    { id: '3f5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 30,  initial: 40,  outType: 2, outBy: 'Kweku Asare', outReason: 'Cleaning supplies issued to maintenance team' },
    { id: '3e5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 18,  initial: 30,  outType: 2, outBy: 'Kweku Asare', outReason: 'Cleaning supplies issued to maintenance team' },
    { id: '3c5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 30,  initial: 40,  outType: 2, outBy: 'Kweku Asare', outReason: 'Cleaning supplies issued to maintenance team' },
    { id: '3b5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 24,  initial: 30,  outType: 2, outBy: 'Kweku Asare', outReason: 'Cleaning supplies issued to maintenance team' },
    { id: '3d5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 144, initial: 200, outType: 2, outBy: 'Kweku Asare', outReason: 'Cleaning supplies issued to maintenance team' },
    // Electronics
    { id: '325cd2ae-e548-f111-bec6-7ced8d6e6816', current: 32, initial: 32 },
    { id: '365cd2ae-e548-f111-bec6-7ced8d6e6816', current: 5,  initial: 5 },
    { id: '395cd2ae-e548-f111-bec6-7ced8d6e6816', current: 12, initial: 20, outType: 2, outBy: 'Nana Barimah', outReason: 'Toner cartridges replaced in staff printers' },
    { id: '345cd2ae-e548-f111-bec6-7ced8d6e6816', current: 9,  initial: 9 },
    { id: '3a5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 14, initial: 14 },
    // Furniture
    { id: '315cd2ae-e548-f111-bec6-7ced8d6e6816', current: 8,   initial: 8 },
    { id: '2e5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 235, initial: 235 },
    { id: '2d5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 210, initial: 210 },
    { id: '2f5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 22,  initial: 22 },
    { id: '305cd2ae-e548-f111-bec6-7ced8d6e6816', current: 16,  initial: 16 },
    // Lab Equipment
    { id: '1419e5b4-e548-f111-bec6-7ced8d6e6816', current: 80, initial: 100, outType: 4, outBy: 'Samuel Frimpong', outReason: 'Breakages during practical lab sessions' },
    { id: '1319e5b4-e548-f111-bec6-7ced8d6e6816', current: 20, initial: 20 },
    { id: '1219e5b4-e548-f111-bec6-7ced8d6e6816', current: 18, initial: 18 },
    { id: '1619e5b4-e548-f111-bec6-7ced8d6e6816', current: 45, initial: 45 },
    { id: '1519e5b4-e548-f111-bec6-7ced8d6e6816', current: 12, initial: 16,  outType: 4, outBy: 'Samuel Frimpong', outReason: 'Breakages during practical lab sessions' },
    // Medical
    { id: '1b19e5b4-e548-f111-bec6-7ced8d6e6816', current: 10, initial: 16, outType: 2, outBy: 'Charity Osei', outReason: 'Used for first-aid treatment in sick bay' },
    { id: '1719e5b4-e548-f111-bec6-7ced8d6e6816', current: 6,  initial: 6 },
    { id: '1919e5b4-e548-f111-bec6-7ced8d6e6816', current: 15, initial: 25, outType: 2, outBy: 'Charity Osei', outReason: 'Used for first-aid treatment in sick bay' },
    { id: '1a19e5b4-e548-f111-bec6-7ced8d6e6816', current: 8,  initial: 15, outType: 2, outBy: 'Charity Osei', outReason: 'Used for first-aid treatment in sick bay' },
    { id: '1819e5b4-e548-f111-bec6-7ced8d6e6816', current: 20, initial: 30, outType: 2, outBy: 'Charity Osei', outReason: 'Used for first-aid treatment in sick bay' },
    // Sports
    { id: '425cd2ae-e548-f111-bec6-7ced8d6e6816', current: 60, initial: 60 },
    { id: '405cd2ae-e548-f111-bec6-7ced8d6e6816', current: 14, initial: 20, outType: 4, outBy: 'Isaac Quaye', outReason: 'Worn-out balls retired after PE sessions' },
    { id: '1119e5b4-e548-f111-bec6-7ced8d6e6816', current: 4,  initial: 4 },
    { id: '415cd2ae-e548-f111-bec6-7ced8d6e6816', current: 8,  initial: 12, outType: 4, outBy: 'Isaac Quaye', outReason: 'Worn-out balls retired after PE sessions' },
    // Stationery
    { id: '265cd2ae-e548-f111-bec6-7ced8d6e6816', current: 0,   initial: 45 }, // A4 paper: existing record covers 45->0
    { id: '235cd2ae-e548-f111-bec6-7ced8d6e6816', current: 480, initial: 700, outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '255cd2ae-e548-f111-bec6-7ced8d6e6816', current: 620, initial: 900, outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '2c5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 120, initial: 150, outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '245cd2ae-e548-f111-bec6-7ced8d6e6816', current: 300, initial: 450, outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '285cd2ae-e548-f111-bec6-7ced8d6e6816', current: 60,  initial: 80,  outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '2b5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 55,  initial: 60,  outType: 4, outBy: 'Emmanuel Boateng', outReason: 'Lost or damaged units written off' },
    { id: '2a5cd2ae-e548-f111-bec6-7ced8d6e6816', current: 30,  initial: 40,  outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
    { id: '295cd2ae-e548-f111-bec6-7ced8d6e6816', current: 18,  initial: 20,  outType: 4, outBy: 'Emmanuel Boateng', outReason: 'Lost or damaged units written off' },
    { id: '275cd2ae-e548-f111-bec6-7ced8d6e6816', current: 96,  initial: 140, outType: 2, outBy: 'Emmanuel Boateng', outReason: 'Distributed to staff and students' },
];

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

async function runBatched<T>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<void>,
): Promise<{ success: number; failed: number }> {
    let idx = 0;
    let success = 0, failed = 0;

    async function worker() {
        while (idx < items.length) {
            const i = idx++;
            try {
                await fn(items[i], i);
                success++;
            } catch (err: any) {
                failed++;
                console.error(`     ✗ ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
            }
        }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return { success, failed };
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Fix: Grey Academy Library Loans + Inventory Movements');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);
    const f = `_sms_school_value eq ${GREY_ACADEMY_ID}`;

    // ── 1. Fix LN-NOBIND ──
    console.log('1. Fixing LN-NOBIND -> LN-2026-019');
    await client.patch(`sms_libraryloans(${LN_NOBIND_ID})`, {
        sms_name: 'LN-2026-019',
        sms_loanstatus: 3, // Overdue (duedate 2026-04-30 already passed, no return)
        sms_borrowertypecode: 1, // Student
        'sms_librarybook@odata.bind': `/sms_librarybooks(${BOOK_SOCIAL_STUDIES})`,
        'sms_student@odata.bind':     `/sms_students(${STUDENT_COURAGE_ACHEAMPONG})`,
    });
    console.log('   ✓ done');

    // ── 2. Set library book copy counts ──
    console.log('2. Setting sms_totalcopies / sms_availablecopies on 22 books');
    {
        const entries = Object.entries(BOOK_COPIES);
        const r = await runBatched(entries, 5, async ([id, copies]) => {
            await client.patch(`sms_librarybooks(${id})`, {
                sms_totalcopies: copies.total,
                sms_availablecopies: copies.available,
            });
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${entries.length})`);
    }

    // ── 3. Seed inventory movements ──
    console.log('3. Seeding inventory movements');
    const items = await getAll<{ sms_inventoryitemid: string; sms_name: string }>(
        client, `sms_inventoryitems?$select=sms_inventoryitemid,sms_name&$filter=${f}`,
    );
    const itemNames = new Map(items.map((i) => [i.sms_inventoryitemid, i.sms_name]));

    const jobs: { itemid: string; itemname: string; movementtype: number; quantity: number; quantitybefore: number; quantityafter: number; reason: string | null; movedby: string }[] = [];
    INVENTORY_FLOWS.forEach((flow) => {
        const itemname = itemNames.get(flow.id) ?? '';
        jobs.push({
            itemid: flow.id, itemname,
            movementtype: 1, // Stock In
            quantity: flow.initial, quantitybefore: 0, quantityafter: flow.initial,
            reason: 'Start-of-term stock replenishment',
            movedby: 'Kweku Asare',
        });
        if (flow.outType) {
            jobs.push({
                itemid: flow.id, itemname,
                movementtype: flow.outType,
                quantity: flow.initial - flow.current, quantitybefore: flow.initial, quantityafter: flow.current,
                reason: flow.outReason ?? null,
                movedby: flow.outBy ?? 'Kweku Asare',
            });
        }
    });

    console.log(`   Creating ${jobs.length} movement records...`);
    const base = Date.now();
    const r = await runBatched(jobs, 5, async (j, idx) => {
        const payload: Record<string, unknown> = {
            sms_name: `MOV-${base + idx}`,
            sms_itemid: j.itemid,
            sms_itemname: j.itemname,
            sms_movementtype: j.movementtype,
            sms_quantity: j.quantity,
            sms_quantitybefore: j.quantitybefore,
            sms_quantityafter: j.quantityafter,
            sms_movedby: j.movedby,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        };
        if (j.reason) payload.sms_reason = j.reason;
        await client.post('sms_inventorymovements', payload);
    });
    console.log(`   ${r.success} ok, ${r.failed} failed (of ${jobs.length})`);

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
