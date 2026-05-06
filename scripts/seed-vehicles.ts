/**
 * seed-vehicles.ts — Populates sms_vehicles with realistic school transport records.
 * Covers buses, minibuses, and vans used for student transport in a Ghana basic school.
 * Safe to re-run (skips by plate number).
 * Run: npm run seed:vehicles
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

// Vehicle type picklist: 1=Bus  2=Minibus  3=Van  4=Motorcycle  5=Car
// Status picklist:       1=Active  2=Maintenance  3=Retired

interface Vehicle {
    name: string;
    plate: string;
    capacity: number;
    driver: string;
    driverphone: string;
    year: number;
    color: string;
    vehicletype: number;
    status: number;
    notes?: string;
}

const VEHICLES: Vehicle[] = [
    // ── Buses ──────────────────────────────────────────────────────────────────
    {
        name:        'School Bus 01 — Yellow Star',
        plate:       'GR-2341-18',
        capacity:    52,
        driver:      'Emmanuel Asante',
        driverphone: '+233 24 510 8801',
        year:        2018,
        color:       'Yellow',
        vehicletype: 1, // Bus
        status:      1, // Active
        notes:       'Serves Kumasi North route — picks up students from Suame, Aboabo and Manhyia',
    },
    {
        name:        'School Bus 02 — Blue Falcon',
        plate:       'GR-4872-19',
        capacity:    52,
        driver:      'Kweku Mensah',
        driverphone: '+233 20 633 4412',
        year:        2019,
        color:       'Blue & White',
        vehicletype: 1, // Bus
        status:      1, // Active
        notes:       'Serves Kumasi South route — Asokwa, Oforikrom, and Banso',
    },
    {
        name:        'School Bus 03 — Red Arrow',
        plate:       'GR-1193-15',
        capacity:    45,
        driver:      'Yaw Boateng',
        driverphone: '+233 27 900 6637',
        year:        2015,
        color:       'Red',
        vehicletype: 1, // Bus
        status:      2, // Maintenance
        notes:       'Brake system under repair at Kumasi Mechanical Workshop. Expected return: 2 weeks.',
    },
    {
        name:        'School Bus 04 — Green Express',
        plate:       'GR-5560-20',
        capacity:    60,
        driver:      'Kofi Adu',
        driverphone: '+233 24 788 2250',
        year:        2020,
        color:       'Green',
        vehicletype: 1, // Bus
        status:      1, // Active
        notes:       'Largest capacity bus — assigned to inter-school sports days and excursions',
    },

    // ── Minibuses ───────────────────────────────────────────────────────────────
    {
        name:        'Minibus 01 — Staff Shuttle',
        plate:       'GR-7723-17',
        capacity:    18,
        driver:      'Abena Owusu',
        driverphone: '+233 55 301 7741',
        year:        2017,
        color:       'Silver',
        vehicletype: 2, // Minibus
        status:      1, // Active
        notes:       'Dedicated staff morning and afternoon shuttle from Bantama junction',
    },
    {
        name:        'Minibus 02 — Kite',
        plate:       'GR-3381-21',
        capacity:    18,
        driver:      'Kwame Ofori',
        driverphone: '+233 20 414 5590',
        year:        2021,
        color:       'White & Blue',
        vehicletype: 2, // Minibus
        status:      1, // Active
        notes:       'Covers Bekwai road feeder routes for boarders on weekends',
    },
    {
        name:        'Minibus 03 — Old Faithful',
        plate:       'GR-0882-10',
        capacity:    14,
        driver:      'Isaac Darko',
        driverphone: '+233 24 200 8823',
        year:        2010,
        color:       'Cream',
        vehicletype: 2, // Minibus
        status:      3, // Retired
        notes:       'Decommissioned — chassis fatigue. Kept on-site as spare parts source.',
    },

    // ── Vans ───────────────────────────────────────────────────────────────────
    {
        name:        'Admin Van — Hyundai H1',
        plate:       'GR-6614-22',
        capacity:    9,
        driver:      'Nana Ama Boateng',
        driverphone: '+233 55 877 0034',
        year:        2022,
        color:       'White',
        vehicletype: 3, // Van
        status:      1, // Active
        notes:       'Admin errands, bank runs, and headmaster field visits',
    },
    {
        name:        'Sick Bay Van — Medical Response',
        plate:       'GR-4401-20',
        capacity:    5,
        driver:      'Prince Asiedu',
        driverphone: '+233 24 999 1155',
        year:        2020,
        color:       'White with Red Cross',
        vehicletype: 3, // Van
        status:      1, // Active
        notes:       'Reserved for medical emergencies — always fuelled. Driver on-call 24/7.',
    },
];

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_vehicles');
    console.log('══════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing records to skip duplicates (keyed by plate number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_vehicles?$select=sms_vehicleid,sms_plate`,
        { headers: h, timeout: 30000 }
    );
    const existingPlates = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => (r.sms_plate ?? '').toLowerCase())
    );
    console.log(`  ${existingPlates.size} existing vehicle(s) — skipping duplicates\n`);

    let created = 0, skipped = 0;

    for (const v of VEHICLES) {
        if (existingPlates.has(v.plate.toLowerCase())) {
            console.log(`  [SKIP] ${v.plate}  ${v.name}`);
            skipped++; continue;
        }

        const payload: Record<string, unknown> = {
            sms_name:        v.name,
            sms_plate:       v.plate,
            sms_capacity:    v.capacity,
            sms_driver:      v.driver,
            sms_driverphone: v.driverphone,
            sms_year:        v.year,
            sms_color:       v.color,
            sms_vehicletype: v.vehicletype,
            sms_status:      v.status,
        };
        if (v.notes) payload.sms_notes = v.notes;

        await axios.post(`${API}/sms_vehicles`, payload, { headers: ph, timeout: 30000 });
        const typeLabel = ['', 'Bus', 'Minibus', 'Van', 'Motorcycle', 'Car'][v.vehicletype];
        const statusLabel = ['', 'Active', 'Maintenance', 'Retired'][v.status];
        console.log(`  [OK]   ${v.plate.padEnd(14)} ${typeLabel.padEnd(10)} ${statusLabel.padEnd(12)} ${v.name}`);
        created++;
    }

    const active      = VEHICLES.filter(v => v.status === 1).length;
    const maintenance = VEHICLES.filter(v => v.status === 2).length;
    const retired     = VEHICLES.filter(v => v.status === 3).length;

    console.log(`\n✓ Done: ${created} created, ${skipped} skipped`);
    console.log(`  Fleet summary — Active: ${active}  Maintenance: ${maintenance}  Retired: ${retired}`);
    console.log(`  Total capacity (active): ${VEHICLES.filter(v => v.status === 1).reduce((s, v) => s + v.capacity, 0)} seats\n`);
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
