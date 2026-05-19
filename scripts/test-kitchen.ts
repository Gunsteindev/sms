import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const MENUS  = 'sms_kitchenmenus';
const ORDERS = 'sms_mealorders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let h: any;

async function getToken() {
    const tok = (await axios.post(
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

    // ── 0. School & student ────────────────────────────────────────────────────
    console.log('0. Fetch school + student');
    let schoolId = '', studentId = '', studentName = '';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rs = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        schoolId = rs.data.value?.[0]?.sms_schoolid ?? '';
        pass(`School: "${rs.data.value?.[0]?.sms_name}" (${schoolId})`);
    } catch (e) { fail(`Schools: ${errMsg(e)}`); }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rs = await axios.get<any>(`${API}/sms_students?$select=sms_studentid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        studentId   = rs.data.value?.[0]?.sms_studentid ?? '';
        studentName = rs.data.value?.[0]?.sms_name ?? 'Test Student';
        pass(`Student: "${studentName}" (${studentId})`);
    } catch (e) { fail(`Students: ${errMsg(e)}`); }

    if (!schoolId) { console.log('\nNo school — aborting.'); return; }

    // ════════════════════════════════════════════════════════════════════
    console.log('\n══ sms_kitchenmenu ══');

    // ── 1. List ────────────────────────────────────────────────────────
    console.log('\n1. List menus (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${MENUS}?$select=sms_kitchenmenuid,sms_name,sms_menudate,sms_mealtype,sms_kitchenmenustatus,sms_totalserved&$top=5&$orderby=createdon desc`,
            { headers: h, timeout: 20000 }
        );
        pass(`Table reachable — ${r.data.value?.length ?? 0} row(s)`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.data.value?.forEach((m: any) => console.log(`     "${m.sms_name}"  date=${m.sms_menudate?.slice(0,10)}  mealtype=${m.sms_mealtype}  status=${m.sms_kitchenmenustatus}  served=${m.sms_totalserved}`));
    } catch (e) { fail(`List menus: ${errMsg(e)}`); return; }

    // ── 2. Create a menu ───────────────────────────────────────────────
    console.log('\n2. Create test menu (Lunch today)');
    let menuId = '';
    const today = new Date().toISOString().slice(0, 10);
    try {
        const payload = {
            sms_name:              `TEST Lunch – ${today}`,
            sms_menudate:          today,
            sms_mealtype:          2,
            sms_items:             'Rice, Chicken stew, Salad, Water',
            sms_price:             3.50,
            sms_totalserved:       0,
            sms_kitchenmenustatus: 1,
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${MENUS}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000,
        });
        menuId = r.data?.sms_kitchenmenuid ?? '';
        pass(`Created menu  id=${menuId}`);
        console.log(`     name="${r.data?.sms_name}"  date=${r.data?.sms_menudate?.slice(0,10)}  price=${r.data?.sms_price}  status=${r.data?.sms_kitchenmenustatus}`);
    } catch (e) { fail(`Create menu: ${errMsg(e)}`); }

    // ── 3. Read menu back ──────────────────────────────────────────────
    if (menuId) {
        console.log('\n3. Read menu by ID');
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = await axios.get<any>(
                `${API}/${MENUS}(${menuId})?$select=sms_kitchenmenuid,sms_name,sms_menudate,sms_mealtype,sms_items,sms_price,sms_totalserved,sms_kitchenmenustatus`,
                { headers: h, timeout: 20000 }
            );
            pass('Read OK');
            console.log(`     items="${r.data.sms_items}"  price=${r.data.sms_price}`);
        } catch (e) { fail(`Read menu: ${errMsg(e)}`); }

        // ── 4. Update (mark served) ────────────────────────────────────
        console.log('\n4. Update menu → status=Served, totalserved=42');
        try {
            await axios.patch(`${API}/${MENUS}(${menuId})`,
                { sms_kitchenmenustatus: 2, sms_totalserved: 42 },
                { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 }
            );
            pass('Update OK');
        } catch (e) { fail(`Update menu: ${errMsg(e)}`); }
    }

    // ════════════════════════════════════════════════════════════════════
    console.log('\n══ sms_mealorder ══');

    // ── 5. List orders ─────────────────────────────────────────────────
    console.log('\n5. List meal orders (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${ORDERS}?$select=sms_mealorderid,sms_name,sms_menuid,sms_menudate,sms_mealtype,_sms_student_value,sms_orderdate,sms_amount,sms_paymentstatus&$top=5&$orderby=createdon desc`,
            { headers: h, timeout: 20000 }
        );
        pass(`Table reachable — ${r.data.value?.length ?? 0} row(s)`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.data.value?.forEach((o: any) => {
            const sName = o['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? o._sms_student_value ?? '—';
            console.log(`     "${sName}"  menu="${o.sms_menudate}"  mealtype=${o.sms_mealtype}  amount=${o.sms_amount}  payment=${o.sms_paymentstatus}`);
        });
    } catch (e) { fail(`List orders: ${errMsg(e)}`); return; }

    if (!studentId || !menuId) { console.log('\nNo student or menu — skipping order create/delete.'); }
    else {
        // ── 6. Create an order ─────────────────────────────────────────
        console.log('\n6. Create test meal order');
        let orderId = '';
        try {
            const payload = {
                sms_name:          `${studentName} – TEST Lunch`,
                sms_menuid:        menuId,
                sms_menudate:      `TEST Lunch – ${today}`,
                sms_mealtype:      2,
                'sms_student@odata.bind': `/sms_students(${studentId})`,
                sms_orderdate:     today,
                sms_amount:        3.50,
                sms_paymentstatus: 1,
                'sms_school@odata.bind': `/sms_schools(${schoolId})`,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = await axios.post<any>(`${API}/${ORDERS}`, payload, {
                headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000,
            });
            orderId = r.data?.sms_mealorderid ?? '';
            pass(`Created order  id=${orderId}`);
            const sName = r.data['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? studentName;
            console.log(`     student="${sName}"  amount=${r.data?.sms_amount}  payment=${r.data?.sms_paymentstatus}`);
        } catch (e) { fail(`Create order: ${errMsg(e)}`); }

        // ── 7. Delete order ────────────────────────────────────────────
        if (orderId) {
            console.log('\n7. Delete test order');
            try {
                await axios.delete(`${API}/${ORDERS}(${orderId})`, { headers: h, timeout: 20000 });
                pass(`Deleted order ${orderId}`);
            } catch (e) { fail(`Delete order: ${errMsg(e)}`); }
        }
    }

    // ── 8. Delete test menu ────────────────────────────────────────────
    if (menuId) {
        console.log('\n8. Delete test menu');
        try {
            await axios.delete(`${API}/${MENUS}(${menuId})`, { headers: h, timeout: 20000 });
            pass(`Deleted menu ${menuId}`);
        } catch (e) { fail(`Delete menu: ${errMsg(e)}`); }
    }

    console.log('\nDone.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
