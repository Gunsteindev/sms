/**
 * seed-grey-academy-transport-kitchen.ts
 *
 * Task #9 — seed Grey Academy's Transport (Route Assignments, Vehicle
 * Maintenance) and Kitchen (Menus, Meal Orders) modules. Audit found all
 * 4 tables completely empty (0 records each), despite 9 vehicles and 40
 * students already existing.
 *
 * 1. Route Assignments — 25 Accra-area students grouped into 4 bus routes
 *    by their parent's address suburb, linked to 4 buses. Route D (Red
 *    Arrow) is marked Suspended to match that vehicle's "Maintenance"
 *    status.
 * 2. Vehicle Maintenance — 12 records: completed routine service for 7
 *    active vehicles, 3 upcoming scheduled services, an in-progress repair
 *    for Red Arrow (matches its Maintenance status), and a final repair for
 *    the retired Old Faithful minibus.
 * 3. Kitchen Menus — 10 weekdays (2026-06-01..2026-06-12, same window as
 *    Task #7 attendance) x Lunch + Snack = 20 menus, Ghanaian dishes.
 * 4. Meal Orders — 24 students on the school meal plan x 10 lunch days =
 *    240 orders. Kofi Asante Jr (scholarship recipient) gets
 *    Free/Subsidized; 2 students go Unpaid on the last 2 days.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-transport-kitchen.ts
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

// ── Vehicles ──
const BUS_YELLOW_STAR    = 'cb82145c-2f49-f111-bec6-7ced8d6e6816'; // GR-2341-18, status=1 Active
const BUS_BLUE_FALCON    = 'cc82145c-2f49-f111-bec6-7ced8d6e6816'; // GR-4872-19, status=1 Active
const BUS_RED_ARROW      = 'cd82145c-2f49-f111-bec6-7ced8d6e6816'; // GR-1193-15, status=2 Maintenance
const BUS_GREEN_EXPRESS  = 'ce82145c-2f49-f111-bec6-7ced8d6e6816'; // GR-5560-20, status=1 Active
const MINIBUS_SHUTTLE    = 'cf82145c-2f49-f111-bec6-7ced8d6e6816'; // GR-7723-17, status=1 Active
const MINIBUS_KITE       = 'd082145c-2f49-f111-bec6-7ced8d6e6816'; // GR-3381-21, status=1 Active
const MINIBUS_OLD_FAITHFUL = 'd182145c-2f49-f111-bec6-7ced8d6e6816'; // GR-0882-10, status=3 Retired
const ADMIN_VAN          = 'd282145c-2f49-f111-bec6-7ced8d6e6816'; // GR-6614-22, status=1 Active
const SICKBAY_VAN        = 'd382145c-2f49-f111-bec6-7ced8d6e6816'; // GR-4401-20, status=1 Active

// ── Route Assignments: vehicleId, routename, status, [studentId, pickuppoint, pickuptime, name] ──
interface RouteStop { studentId: string; pickuppoint: string; pickuptime: string; name: string; }
interface RoutePlan { vehicleId: string; routename: string; status: number; stops: RouteStop[]; }

const ROUTES: RoutePlan[] = [
    {
        vehicleId: BUS_YELLOW_STAR, routename: 'Route A - East Legon / Madina', status: 1,
        stops: [
            { studentId: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'East Legon - American House Junction', pickuptime: '6:15 AM', name: 'Gloria Asante' },
            { studentId: '0a32a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'East Legon - American House Junction', pickuptime: '6:15 AM', name: 'Kofi Asante Jr' },
            { studentId: '1532a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Madina - Madina Market', pickuptime: '6:25 AM', name: 'Nana Amponsah' },
            { studentId: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Madina - Madina Market', pickuptime: '6:25 AM', name: 'Rachel Amponsah' },
        ],
    },
    {
        vehicleId: BUS_BLUE_FALCON, routename: 'Route B - Spintex / Tema', status: 1,
        stops: [
            { studentId: '57893d40-d634-f111-88b4-7ced8d3bbf70', pickuppoint: 'Spintex - Total Filling Station', pickuptime: '6:00 AM', name: 'James Bond' },
            { studentId: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Tema Community 1 - Roundabout', pickuptime: '6:10 AM', name: 'Akua Darko' },
            { studentId: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Tema Community 1 - Roundabout', pickuptime: '6:10 AM', name: 'Linda Darko' },
            { studentId: '1932a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Tema Community 5 - Market', pickuptime: '6:20 AM', name: 'Bright Tetteh' },
            { studentId: 'd9fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Tema Community 5 - Market', pickuptime: '6:20 AM', name: 'Vivian Tetteh' },
        ],
    },
    {
        vehicleId: BUS_GREEN_EXPRESS, routename: 'Route C - Osu / Labone / Asylum Down / Ridge', status: 1,
        stops: [
            { studentId: '1032a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Osu - Oxford Street', pickuptime: '6:05 AM', name: 'Kojo Nkrumah' },
            { studentId: 'd0fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Osu - Oxford Street', pickuptime: '6:05 AM', name: 'Michael Nkrumah' },
            { studentId: '1332a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Labone - Labone Junction', pickuptime: '6:15 AM', name: 'Adwoa Appiah' },
            { studentId: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', pickuppoint: 'Labone - Labone Junction', pickuptime: '6:15 AM', name: 'Karen Appiah' },
            { studentId: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Labone - Labone Junction', pickuptime: '6:15 AM', name: 'Patricia Appiah' },
            { studentId: '1732a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Asylum Down - Police Station', pickuptime: '6:25 AM', name: 'Emmanuel Bediako' },
            { studentId: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Asylum Down - Police Station', pickuptime: '6:25 AM', name: 'Theresa Bediako' },
            { studentId: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Ridge - Ridge Hospital Roundabout', pickuptime: '6:35 AM', name: 'Courage Acheampong' },
        ],
    },
    {
        vehicleId: BUS_RED_ARROW, routename: 'Route D - Dansoman / Kotobabi / Abelemkpe / Achimota / Adabraka', status: 2,
        stops: [
            { studentId: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Dansoman - Last Stop', pickuptime: '6:00 AM', name: 'Kekeli Adjei' },
            { studentId: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Dansoman - Last Stop', pickuptime: '6:00 AM', name: 'Yaw Adjei' },
            { studentId: '77d04ebb-8332-f111-88b4-7ced8d706811', pickuppoint: 'Kotobabi - Junction', pickuptime: '6:10 AM', name: 'Mikel Shawn' },
            { studentId: '74f6928c-e034-f111-88b4-7ced8d3bbf70', pickuppoint: 'Abelemkpe - Total Filling Station', pickuptime: '6:20 AM', name: 'Emilia Lawson' },
            { studentId: '0b32a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Achimota - Mall', pickuptime: '6:30 AM', name: 'Ama Mensah' },
            { studentId: 'cbfca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Achimota - Mall', pickuptime: '6:30 AM', name: 'Herman Mensah' },
            { studentId: '1832a6ae-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Adabraka - Market', pickuptime: '6:40 AM', name: 'Gifty Quaye' },
            { studentId: 'd8fca0b4-c03f-f111-bec6-70a8a59a431e', pickuppoint: 'Adabraka - Market', pickuptime: '6:40 AM', name: 'Uriah Quaye' },
        ],
    },
];

// ── Vehicle Maintenance ──
interface MaintRecord {
    vehicleId: string; type: number; status: number; scheduled: string; completed?: string;
    cost: number; tech: string; desc: string; notes: string;
}
const MAINTENANCE: MaintRecord[] = [
    // Completed routine service for active vehicles
    { vehicleId: BUS_YELLOW_STAR,  type: 1, status: 3, scheduled: '2026-05-04', completed: '2026-05-04', cost: 850, tech: 'Kwabena Asante - City Auto Works', desc: 'Routine service - oil change, brake check, general inspection', notes: 'All systems normal. Next service due in 3 months.' },
    { vehicleId: BUS_BLUE_FALCON,  type: 1, status: 3, scheduled: '2026-05-06', completed: '2026-05-06', cost: 820, tech: 'Kwabena Asante - City Auto Works', desc: 'Routine service - oil change, brake check, general inspection', notes: 'Replaced wiper blades. Vehicle in good condition.' },
    { vehicleId: BUS_GREEN_EXPRESS, type: 1, status: 3, scheduled: '2026-05-08', completed: '2026-05-08', cost: 870, tech: 'Kwabena Asante - City Auto Works', desc: 'Routine service - oil change, brake check, general inspection', notes: 'All systems normal.' },
    { vehicleId: MINIBUS_SHUTTLE,  type: 1, status: 3, scheduled: '2026-04-22', completed: '2026-04-22', cost: 620, tech: 'Yaw Boadi - Tema Motors Ltd', desc: 'Routine service - oil change and tyre rotation', notes: 'Good condition.' },
    { vehicleId: MINIBUS_KITE,     type: 4, status: 3, scheduled: '2026-05-15', completed: '2026-05-16', cost: 1450, tech: 'Yaw Boadi - Tema Motors Ltd', desc: 'Replaced all four tyres', notes: 'Old tyres worn below safety threshold.' },
    { vehicleId: ADMIN_VAN,        type: 1, status: 3, scheduled: '2026-04-10', completed: '2026-04-10', cost: 540, tech: 'Frank Owusu - Speedline Garage', desc: 'Routine service - oil change, filter replacement', notes: 'No issues found.' },
    { vehicleId: SICKBAY_VAN,      type: 3, status: 3, scheduled: '2026-05-20', completed: '2026-05-20', cost: 300, tech: 'Frank Owusu - Speedline Garage', desc: 'Annual roadworthiness inspection', notes: 'Passed inspection. Certificate valid until 2027-05-20.' },
    // Upcoming scheduled maintenance
    { vehicleId: BUS_YELLOW_STAR,  type: 4, status: 1, scheduled: '2026-07-10', cost: 1600, tech: 'Kwabena Asante - City Auto Works', desc: 'Tyre replacement (front pair)', notes: 'Scheduled during end-of-term break.' },
    { vehicleId: BUS_BLUE_FALCON,  type: 3, status: 1, scheduled: '2026-07-15', cost: 350, tech: 'Kwabena Asante - City Auto Works', desc: 'Annual roadworthiness inspection', notes: 'Scheduled ahead of certificate expiry.' },
    { vehicleId: MINIBUS_SHUTTLE,  type: 1, status: 1, scheduled: '2026-07-20', cost: 650, tech: 'Yaw Boadi - Tema Motors Ltd', desc: 'Routine service - oil change and tyre rotation', notes: 'Scheduled for end-of-term break.' },
    // Red Arrow - in-progress repair (matches vehicle status=2 Maintenance)
    { vehicleId: BUS_RED_ARROW,    type: 2, status: 2, scheduled: '2026-06-08', cost: 4200, tech: 'Kwabena Asante - City Auto Works', desc: 'Engine overheating - radiator and water pump replacement', notes: 'Awaiting parts delivery; vehicle off the road until repair completes.' },
    // Old Faithful - final repair before retirement
    { vehicleId: MINIBUS_OLD_FAITHFUL, type: 2, status: 3, scheduled: '2026-03-12', completed: '2026-03-18', cost: 6800, tech: 'Yaw Boadi - Tema Motors Ltd', desc: 'Gearbox failure - full transmission overhaul', notes: 'High repair cost relative to vehicle value; recommended for retirement after this repair.' },
];

// ── Kitchen Menus: 10 weekdays x (Lunch + Snack) ──
const MENU_DAYS = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
const TODAY = '2026-06-12';

const LUNCH_DISHES = [
    'Jollof Rice with Grilled Chicken & Coleslaw',
    'Banku with Tilapia & Pepper Sauce',
    'Waakye with Boiled Egg & Gari',
    'Fufu with Light Soup (Goat Meat)',
    'Rice and Beans with Fried Plantain',
    'Kenkey with Fried Fish & Shito',
    'Yam and Garden Egg Stew',
    'Plain Rice with Groundnut Soup',
    'Tuo Zaafi with Ayoyo Soup',
    'Spaghetti Bolognese with Salad',
];
const LUNCH_PRICES = [18, 20, 17, 22, 16, 19, 18, 20, 19, 17];

const SNACK_ITEMS = ['Meat Pie & Sobolo', 'Spring Rolls & Fruit Juice', 'Koose (Bean Cakes) & Tea', 'Bofrot (Doughnuts) & Milo'];
const SNACK_PRICES = [6, 7, 5, 6];

// ── Meal plan: 24 students who order lunch every day (first 24 of 40, by lastname/firstname) ──
const MEAL_PLAN: { studentId: string; name: string }[] = [
    { studentId: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Courage Acheampong' },
    { studentId: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Kekeli Adjei' },
    { studentId: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Yaw Adjei' },
    { studentId: 'c9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Felix Adusei' },
    { studentId: '1632a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akosua Agyei' },
    { studentId: 'd6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Samuel Agyei' },
    { studentId: '1232a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwabena Amankwah' },
    { studentId: 'd2fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Oscar Amankwah' },
    { studentId: '1532a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Nana Amponsah' },
    { studentId: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Rachel Amponsah' },
    { studentId: '1332a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Adwoa Appiah' },
    { studentId: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', name: 'Karen Appiah' },
    { studentId: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Patricia Appiah' },
    { studentId: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Gloria Asante' },
    { studentId: '0a32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kofi Asante Jr' },
    { studentId: 'c6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Bernice Asiedu' },
    { studentId: '1732a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Emmanuel Bediako' },
    { studentId: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Theresa Bediako' },
    { studentId: 'ccfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Irene Boateng' },
    { studentId: '0c32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwame Boateng' },
    { studentId: '57893d40-d634-f111-88b4-7ced8d3bbf70', name: 'James Bond' },
    { studentId: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akua Darko' },
    { studentId: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Linda Darko' },
    { studentId: '1432a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Fiifi Frimpong' },
];
const SCHOLARSHIP_STUDENT_ID = '0a32a6ae-c03f-f111-bec6-70a8a59a431e'; // Kofi Asante Jr -> Free/Subsidized
const UNPAID_STUDENT_IDS = new Set(['c9fca0b4-c03f-f111-bec6-70a8a59a431e', '0c32a6ae-c03f-f111-bec6-70a8a59a431e']); // Felix Adusei, Kwame Boateng -> Unpaid on last 2 days
const UNPAID_DAYS = new Set(['2026-06-11', '2026-06-12']);

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
    console.log('  Seed: Grey Academy Transport + Kitchen');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);
    const ph = {
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
            Prefer:             'return=representation',
        },
    };

    // ── 1. Route Assignments ──
    console.log('1. Seeding Route Assignments');
    {
        const jobs: { vehicleId: string; routename: string; status: number; stop: RouteStop }[] = [];
        ROUTES.forEach((r) => r.stops.forEach((stop) => jobs.push({ vehicleId: r.vehicleId, routename: r.routename, status: r.status, stop })));
        const result = await runBatched(jobs, 5, async (j) => {
            await client.post('sms_routeassignments', {
                sms_name: `${j.stop.name} - ${j.routename}`,
                'sms_student@odata.bind': `/sms_students(${j.stop.studentId})`,
                'sms_vehicle@odata.bind': `/sms_vehicles(${j.vehicleId})`,
                sms_routename: j.routename,
                sms_pickuppoint: j.stop.pickuppoint,
                sms_pickuptime: j.stop.pickuptime,
                sms_routestatus: j.status,
                'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
            });
        });
        console.log(`   ${result.success} ok, ${result.failed} failed (of ${jobs.length})`);
    }

    // ── 2. Vehicle Maintenance ──
    console.log('2. Seeding Vehicle Maintenance');
    {
        const result = await runBatched(MAINTENANCE, 5, async (m) => {
            const typeLabel = { 1: 'Routine Service', 2: 'Repair', 3: 'Inspection', 4: 'Tyre Change', 5: 'Other' }[m.type];
            const payload: Record<string, unknown> = {
                sms_name: `Vehicle - ${typeLabel}`,
                'sms_vehicle@odata.bind': `/sms_vehicles(${m.vehicleId})`,
                sms_maintenancetype: m.type,
                sms_maintenancestatus: m.status,
                sms_scheduleddate: m.scheduled,
                sms_cost: m.cost,
                sms_technicianname: m.tech,
                sms_description: m.desc,
                sms_notes: m.notes,
                'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
            };
            if (m.completed) payload.sms_completeddate = m.completed;
            await client.post('sms_vehiclemaintenances', payload);
        });
        console.log(`   ${result.success} ok, ${result.failed} failed (of ${MAINTENANCE.length})`);
    }

    // ── 3. Kitchen Menus ──
    console.log('3. Seeding Kitchen Menus');
    const lunchMenus: { menuid: string; name: string; date: string; price: number }[] = [];
    {
        const jobs: { date: string; mealtype: number; name: string; items: string; price: number; served: number; status: number; isLunch: boolean }[] = [];
        MENU_DAYS.forEach((date, i) => {
            const status = date < TODAY ? 2 : 1; // Served for past days, Planned for today
            jobs.push({ date, mealtype: 2, name: `Lunch - ${date}`, items: LUNCH_DISHES[i], price: LUNCH_PRICES[i], served: status === 2 ? 24 : 0, status, isLunch: true });
            jobs.push({ date, mealtype: 4, name: `Snack - ${date}`, items: SNACK_ITEMS[i % SNACK_ITEMS.length], price: SNACK_PRICES[i % SNACK_PRICES.length], served: status === 2 ? 16 : 0, status, isLunch: false });
        });

        const result = await runBatched(jobs, 5, async (j) => {
            const res = await client.post('sms_kitchenmenus', {
                sms_name: j.name,
                sms_menudate: j.date,
                sms_mealtype: j.mealtype,
                sms_items: j.items,
                sms_price: j.price,
                sms_totalserved: j.served,
                sms_kitchenmenustatus: j.status,
                'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
            }, ph);
            if (j.isLunch) lunchMenus.push({ menuid: res.data.sms_kitchenmenuid, name: res.data.sms_name, date: j.date, price: j.price });
        });
        console.log(`   ${result.success} ok, ${result.failed} failed (of ${jobs.length})`);
    }

    // ── 4. Meal Orders (24 students x 10 lunch days) ──
    console.log('4. Seeding Meal Orders');
    {
        const jobs: { menu: typeof lunchMenus[number]; student: typeof MEAL_PLAN[number] }[] = [];
        lunchMenus.forEach((menu) => MEAL_PLAN.forEach((student) => jobs.push({ menu, student })));

        const result = await runBatched(jobs, 5, async (j) => {
            let paymentstatus = 1; // Paid
            if (j.student.studentId === SCHOLARSHIP_STUDENT_ID) paymentstatus = 3; // Free/Subsidized
            else if (UNPAID_STUDENT_IDS.has(j.student.studentId) && UNPAID_DAYS.has(j.menu.date)) paymentstatus = 2; // Unpaid

            await client.post('sms_mealorders', {
                sms_name: `${j.student.name} - ${j.menu.name}`,
                sms_menuid: j.menu.menuid,
                sms_menudate: j.menu.name, // sms_menudate (String) stores the menu label
                sms_mealtype: 2,
                'sms_student@odata.bind': `/sms_students(${j.student.studentId})`,
                sms_orderdate: j.menu.date,
                sms_amount: paymentstatus === 3 ? 0 : j.menu.price,
                sms_paymentstatus: paymentstatus,
                'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
            });
        });
        console.log(`   ${result.success} ok, ${result.failed} failed (of ${jobs.length})`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
