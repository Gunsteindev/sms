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

function dateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function post(url: string, body: any): Promise<any> {
    const r = await axios.post(`${API}/${url}`, body, {
        headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        timeout: 20000,
    });
    return r.data;
}

async function main() {
    await getToken();
    console.log('Token OK\n');

    // ── Fetch school ──────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schoolRes = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
    const school = schoolRes.data.value?.[0];
    if (!school) { console.error('No school found.'); process.exit(1); }
    const schoolId = school.sms_schoolid;
    console.log(`School: "${school.sms_name}"\n`);

    // ── Fetch up to 20 students ───────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stuRes = await axios.get<any>(`${API}/sms_students?$select=sms_studentid,sms_name&$top=20`, { headers: h, timeout: 20000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students: { id: string; name: string }[] = (stuRes.data.value ?? []).map((s: any) => ({ id: s.sms_studentid, name: s.sms_name }));
    console.log(`Found ${students.length} student(s) to assign orders to.\n`);
    if (!students.length) { console.error('No students found — cannot create orders.'); process.exit(1); }

    const schoolBind = { 'sms_school@odata.bind': `/sms_schools(${schoolId})` };

    // ══════════════════════════════════════════════════════════════════════════
    // MENUS — 7 days (Mon–Sun last week) × 2 meal types each
    // ══════════════════════════════════════════════════════════════════════════
    console.log('═══ Creating menus ═══');

    interface MenuDef {
        date: string;
        mealtype: number;
        items: string;
        price: number;
        totalserved: number;
        status: number; // 1=Planned 2=Served 3=Cancelled
    }

    const menuDefs: MenuDef[] = [
        // ── 7 days ago ──
        { date: dateOffset(-7), mealtype: 1, items: 'Oatmeal porridge, Boiled eggs, Fresh fruit salad, Orange juice',           price: 2.00, totalserved: 87, status: 2 },
        { date: dateOffset(-7), mealtype: 2, items: 'Jollof rice, Grilled chicken, Coleslaw, Chilled water',                    price: 3.50, totalserved: 134, status: 2 },
        // ── 6 days ago ──
        { date: dateOffset(-6), mealtype: 1, items: 'Bread & butter, Boiled eggs, Banana, Milo drink',                         price: 1.80, totalserved: 92, status: 2 },
        { date: dateOffset(-6), mealtype: 2, items: 'Fufu & groundnut soup, Fried plantain, Salad, Mineral water',             price: 3.50, totalserved: 118, status: 2 },
        // ── 5 days ago ──
        { date: dateOffset(-5), mealtype: 1, items: 'Cornflakes with milk, Toast, Boiled egg, Fruit juice',                    price: 2.00, totalserved: 79, status: 2 },
        { date: dateOffset(-5), mealtype: 2, items: 'Waakye, Fried fish, Gari, Shito pepper sauce, Water',                    price: 3.00, totalserved: 142, status: 2 },
        { date: dateOffset(-5), mealtype: 4, items: 'Chin-chin, Groundnuts, Sobolo drink',                                     price: 1.00, totalserved: 64, status: 2 },
        // ── 4 days ago ──
        { date: dateOffset(-4), mealtype: 1, items: 'Yam & egg stew, Fried plantain, Tea',                                    price: 2.50, totalserved: 88, status: 2 },
        { date: dateOffset(-4), mealtype: 2, items: 'Banku & tilapia, Pepper sauce, Cucumber salad, Water',                   price: 4.00, totalserved: 107, status: 2 },
        // ── 3 days ago ──
        { date: dateOffset(-3), mealtype: 1, items: 'Akple & okra soup, Fried egg, Sobolo',                                   price: 2.00, totalserved: 95, status: 2 },
        { date: dateOffset(-3), mealtype: 2, items: 'Fried rice, Chicken thighs, Baked beans, Salad, Chilled water',          price: 4.00, totalserved: 156, status: 2 },
        { date: dateOffset(-3), mealtype: 4, items: 'Biscuits, Peanut butter, Fruit punch',                                   price: 1.00, totalserved: 71, status: 2 },
        // ── 2 days ago ──
        { date: dateOffset(-2), mealtype: 1, items: 'Tom brown porridge, Boiled eggs, Bread, Milo',                           price: 2.00, totalserved: 83, status: 2 },
        { date: dateOffset(-2), mealtype: 2, items: 'Ampesi & kontomire stew, Fried fish, Water',                             price: 3.50, totalserved: 128, status: 2 },
        // ── Yesterday ──
        { date: dateOffset(-1), mealtype: 1, items: 'Hausa koko & koose, Boiled egg, Orange juice',                           price: 2.00, totalserved: 98, status: 2 },
        { date: dateOffset(-1), mealtype: 2, items: 'Kenkey & fried fish, Pepper sauce, Salad, Water',                        price: 3.00, totalserved: 145, status: 2 },
        { date: dateOffset(-1), mealtype: 4, items: 'Popcorn, Roasted groundnuts, Sobolo',                                    price: 1.00, totalserved: 58, status: 2 },
        // ── Today ──
        { date: dateOffset(0),  mealtype: 1, items: 'Oatmeal, Boiled eggs, Fresh pineapple, Tea',                             price: 2.00, totalserved: 76, status: 2 },
        { date: dateOffset(0),  mealtype: 2, items: 'Jollof rice & chicken, Fried plantain, Coleslaw, Chilled water',         price: 4.00, totalserved: 0,  status: 1 },
        { date: dateOffset(0),  mealtype: 4, items: 'Bofrot (doughnut), Groundnuts, Fruit juice',                             price: 1.00, totalserved: 0,  status: 1 },
        // ── Tomorrow (planned) ──
        { date: dateOffset(1),  mealtype: 1, items: 'Bread & omelette, Avocado, Milo drink',                                  price: 2.00, totalserved: 0,  status: 1 },
        { date: dateOffset(1),  mealtype: 2, items: 'Fried rice & shrimp, Vegetable salad, Chilled water',                    price: 4.50, totalserved: 0,  status: 1 },
    ];

    const mealLabel: Record<number, string> = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack' };
    const createdMenus: { id: string; date: string; mealtype: number; name: string; price: number }[] = [];

    for (const m of menuDefs) {
        const name = `${mealLabel[m.mealtype]} – ${m.date}`;
        try {
            const r = await post(MENUS, {
                sms_name:              name,
                sms_menudate:          m.date,
                sms_mealtype:          m.mealtype,
                sms_items:             m.items,
                sms_price:             m.price,
                sms_totalserved:       m.totalserved,
                sms_kitchenmenustatus: m.status,
                ...schoolBind,
            });
            createdMenus.push({ id: r.sms_kitchenmenuid, date: m.date, mealtype: m.mealtype, name, price: m.price });
            console.log(`  ✓ ${name}  (served=${m.totalserved})`);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log(`  ✗ ${name}: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ORDERS — attach to served menus using real students
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n═══ Creating meal orders ═══');

    const servedMenus = createdMenus.filter(m => {
        const def = menuDefs.find(d => d.date === m.date && d.mealtype === m.mealtype);
        return def && def.status === 2;
    });

    // Payment status distribution: ~70% paid, ~15% unpaid, ~15% free
    const paymentStatus = (i: number) => i % 7 === 0 ? 3 : i % 5 === 0 ? 2 : 1;

    let orderCount = 0;
    for (const menu of servedMenus) {
        // Pick a random subset of students for each menu (3–8 orders per menu)
        const count = Math.min(students.length, 3 + (orderCount % 6));
        const slice = students.slice(orderCount % students.length)
            .concat(students)
            .slice(0, count);

        for (let i = 0; i < slice.length; i++) {
            const stu = slice[i];
            const pstat = paymentStatus(orderCount + i);
            const amount = pstat === 3 ? 0 : menu.price;
            try {
                await post(ORDERS, {
                    sms_name:          `${stu.name} – ${menu.name}`,
                    sms_menuid:        menu.id,
                    sms_menudate:      menu.name,
                    sms_mealtype:      menu.mealtype,
                    'sms_student@odata.bind': `/sms_students(${stu.id})`,
                    sms_orderdate:     menu.date,
                    sms_amount:        amount,
                    sms_paymentstatus: pstat,
                    ...schoolBind,
                });
                orderCount++;
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.log(`  ✗ Order ${stu.name}/${menu.name}: ${(e as any).response?.data?.error?.message ?? (e as Error).message}`);
            }
        }
        console.log(`  ✓ ${count} orders → ${menu.name}`);
    }

    console.log(`\nDone. Created ${createdMenus.length} menus, ${orderCount} meal orders.`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
