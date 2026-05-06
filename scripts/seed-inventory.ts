/**
 * seed-inventory.ts — Populates sms_inventoryitems with realistic school stock records.
 * Covers 8 categories: Stationery, Furniture, Electronics, Cleaning, Sports,
 * Lab Equipment, Medical, Books. Safe to re-run (skips by name).
 * Run: npx tsx scripts/seed-inventory.ts
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

interface Item {
    name: string; category: string; quantity: number; unit: string;
    unitprice: number; reorderlevel: number; supplier: string;
    suppliercontact: string; location: string; description?: string;
}

const ITEMS: Item[] = [
    // ── Stationery ──────────────────────────────────────────────────────────────
    { name: 'Ballpoint Pens (Blue)',       category: 'Stationery',    quantity: 480,  unit: 'pcs',   unitprice: 0.50,   reorderlevel: 100, supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Store Room A', description: 'Bic-brand blue ballpoint pens' },
    { name: 'HB Pencils',                  category: 'Stationery',    quantity: 300,  unit: 'pcs',   unitprice: 0.30,   reorderlevel: 80,  supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Store Room A' },
    { name: 'Exercise Books (80 pages)',   category: 'Stationery',    quantity: 620,  unit: 'pcs',   unitprice: 1.20,   reorderlevel: 150, supplier: 'Printex Ghana Ltd',      suppliercontact: '+233 30 277 0011', location: 'Store Room A', description: 'Ruled 80-page exercise books' },
    { name: 'A4 Printing Paper (500 sh)',  category: 'Stationery',    quantity: 45,   unit: 'ream',  unitprice: 12.50,  reorderlevel: 10,  supplier: 'Printex Ghana Ltd',      suppliercontact: '+233 30 277 0011', location: 'Store Room A' },
    { name: 'Whiteboard Markers (Asst)',   category: 'Stationery',    quantity: 96,   unit: 'pcs',   unitprice: 2.00,   reorderlevel: 30,  supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Store Room A' },
    { name: 'Permanent Markers',           category: 'Stationery',    quantity: 60,   unit: 'pcs',   unitprice: 1.80,   reorderlevel: 20,  supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Store Room A' },
    { name: 'Staplers',                    category: 'Stationery',    quantity: 18,   unit: 'pcs',   unitprice: 8.50,   reorderlevel: 5,   supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Admin Office' },
    { name: 'Staple Pins (Box 5000)',      category: 'Stationery',    quantity: 30,   unit: 'box',   unitprice: 3.00,   reorderlevel: 10,  supplier: 'Ofori Office Supplies',  suppliercontact: '+233 24 100 2001', location: 'Admin Office' },
    { name: 'Scientific Calculators',      category: 'Stationery',    quantity: 55,   unit: 'pcs',   unitprice: 22.00,  reorderlevel: 15,  supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'Store Room B', description: 'Casio fx-82MS scientific calculators' },
    { name: 'Geometry Sets',               category: 'Stationery',    quantity: 120,  unit: 'pcs',   unitprice: 4.50,   reorderlevel: 30,  supplier: 'Printex Ghana Ltd',      suppliercontact: '+233 30 277 0011', location: 'Store Room A' },

    // ── Furniture ───────────────────────────────────────────────────────────────
    { name: 'Student Desks (Wood)',        category: 'Furniture',     quantity: 210,  unit: 'pcs',   unitprice: 85.00,  reorderlevel: 20,  supplier: 'Accra Furniture Works',  suppliercontact: '+233 24 500 7812', location: 'Furniture Store', description: 'Single student desks with storage shelf' },
    { name: 'Student Chairs (Plastic)',    category: 'Furniture',     quantity: 235,  unit: 'pcs',   unitprice: 35.00,  reorderlevel: 25,  supplier: 'Accra Furniture Works',  suppliercontact: '+233 24 500 7812', location: 'Furniture Store' },
    { name: 'Teacher Desks',              category: 'Furniture',     quantity: 22,   unit: 'pcs',   unitprice: 150.00, reorderlevel: 5,   supplier: 'Accra Furniture Works',  suppliercontact: '+233 24 500 7812', location: 'Furniture Store' },
    { name: 'Whiteboards (6×4 ft)',       category: 'Furniture',     quantity: 16,   unit: 'pcs',   unitprice: 180.00, reorderlevel: 4,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'Furniture Store' },
    { name: 'Steel Filing Cabinets',      category: 'Furniture',     quantity: 8,    unit: 'pcs',   unitprice: 220.00, reorderlevel: 2,   supplier: 'Accra Furniture Works',  suppliercontact: '+233 24 500 7812', location: 'Admin Office' },

    // ── Electronics ─────────────────────────────────────────────────────────────
    { name: 'Desktop Computers',          category: 'Electronics',   quantity: 32,   unit: 'pcs',   unitprice: 850.00, reorderlevel: 5,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'ICT Lab',        description: 'HP ProDesk 400 G7 — Intel Core i5' },
    { name: 'Projectors',                 category: 'Electronics',   quantity: 9,    unit: 'pcs',   unitprice: 620.00, reorderlevel: 2,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'AV Store',       description: 'Epson EB-X51 XGA projectors' },
    { name: 'Laser Printers',             category: 'Electronics',   quantity: 5,    unit: 'pcs',   unitprice: 480.00, reorderlevel: 1,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'Admin Office' },
    { name: 'Printer Toner Cartridges',   category: 'Electronics',   quantity: 12,   unit: 'pcs',   unitprice: 65.00,  reorderlevel: 4,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'Store Room B' },
    { name: 'UPS Power Backup Units',     category: 'Electronics',   quantity: 14,   unit: 'pcs',   unitprice: 120.00, reorderlevel: 3,   supplier: 'TechZone Accra',         suppliercontact: '+233 20 333 9900', location: 'ICT Lab' },

    // ── Cleaning ────────────────────────────────────────────────────────────────
    { name: 'Mops & Buckets Set',         category: 'Cleaning',      quantity: 24,   unit: 'set',   unitprice: 18.00,  reorderlevel: 6,   supplier: 'CleanPro Supplies',      suppliercontact: '+233 24 700 4455', location: 'Janitor Store' },
    { name: 'Liquid Floor Detergent (5L)',category: 'Cleaning',      quantity: 30,   unit: 'can',   unitprice: 22.00,  reorderlevel: 8,   supplier: 'CleanPro Supplies',      suppliercontact: '+233 24 700 4455', location: 'Janitor Store' },
    { name: 'Toilet Tissue Rolls',        category: 'Cleaning',      quantity: 144,  unit: 'rolls', unitprice: 1.50,   reorderlevel: 50,  supplier: 'CleanPro Supplies',      suppliercontact: '+233 24 700 4455', location: 'Janitor Store' },
    { name: 'Hand Soap (5L Refill)',      category: 'Cleaning',      quantity: 18,   unit: 'can',   unitprice: 28.00,  reorderlevel: 5,   supplier: 'CleanPro Supplies',      suppliercontact: '+233 24 700 4455', location: 'Janitor Store' },
    { name: 'Brooms & Dustpans',          category: 'Cleaning',      quantity: 30,   unit: 'pcs',   unitprice: 7.50,   reorderlevel: 8,   supplier: 'CleanPro Supplies',      suppliercontact: '+233 24 700 4455', location: 'Janitor Store' },

    // ── Sports ──────────────────────────────────────────────────────────────────
    { name: 'Footballs (Size 5)',          category: 'Sports',        quantity: 14,   unit: 'pcs',   unitprice: 35.00,  reorderlevel: 4,   supplier: 'Sports World Ghana',     suppliercontact: '+233 24 811 3300', location: 'Sports Store' },
    { name: 'Volleyballs',                category: 'Sports',        quantity: 8,    unit: 'pcs',   unitprice: 28.00,  reorderlevel: 3,   supplier: 'Sports World Ghana',     suppliercontact: '+233 24 811 3300', location: 'Sports Store' },
    { name: 'Athletic Jerseys (Asst)',    category: 'Sports',        quantity: 60,   unit: 'pcs',   unitprice: 12.00,  reorderlevel: 20,  supplier: 'Sports World Ghana',     suppliercontact: '+233 24 811 3300', location: 'Sports Store', description: 'Mixed sizes, house colours' },
    { name: 'Table Tennis Sets',          category: 'Sports',        quantity: 4,    unit: 'set',   unitprice: 55.00,  reorderlevel: 1,   supplier: 'Sports World Ghana',     suppliercontact: '+233 24 811 3300', location: 'Sports Store', description: 'Table, 4 bats, 12 balls' },

    // ── Lab Equipment ────────────────────────────────────────────────────────────
    { name: 'Compound Microscopes',       category: 'Lab Equipment', quantity: 18,   unit: 'pcs',   unitprice: 340.00, reorderlevel: 4,   supplier: 'Scilab Ghana',           suppliercontact: '+233 30 266 5500', location: 'Science Lab', description: 'Binocular 400x compound microscopes' },
    { name: 'Bunsen Burners',             category: 'Lab Equipment', quantity: 20,   unit: 'pcs',   unitprice: 45.00,  reorderlevel: 5,   supplier: 'Scilab Ghana',           suppliercontact: '+233 30 266 5500', location: 'Science Lab' },
    { name: 'Beakers (Asst Sizes)',       category: 'Lab Equipment', quantity: 80,   unit: 'pcs',   unitprice: 5.50,   reorderlevel: 20,  supplier: 'Scilab Ghana',           suppliercontact: '+233 30 266 5500', location: 'Science Lab', description: '50ml, 100ml, 250ml, 500ml sets' },
    { name: 'Test Tubes (Box 100)',       category: 'Lab Equipment', quantity: 12,   unit: 'box',   unitprice: 18.00,  reorderlevel: 3,   supplier: 'Scilab Ghana',           suppliercontact: '+233 30 266 5500', location: 'Science Lab' },
    { name: 'Safety Goggles',             category: 'Lab Equipment', quantity: 45,   unit: 'pcs',   unitprice: 9.00,   reorderlevel: 15,  supplier: 'Scilab Ghana',           suppliercontact: '+233 30 266 5500', location: 'Science Lab' },

    // ── Medical ──────────────────────────────────────────────────────────────────
    { name: 'First Aid Kits (Full)',       category: 'Medical',       quantity: 6,    unit: 'kit',   unitprice: 75.00,  reorderlevel: 2,   supplier: 'MedPlus Ghana',          suppliercontact: '+233 20 900 1122', location: 'Sick Bay', description: 'ANSI Class A compliant kits' },
    { name: 'Sterile Bandages (Box)',      category: 'Medical',       quantity: 20,   unit: 'box',   unitprice: 12.00,  reorderlevel: 5,   supplier: 'MedPlus Ghana',          suppliercontact: '+233 20 900 1122', location: 'Sick Bay' },
    { name: 'Latex Gloves (Box 100)',      category: 'Medical',       quantity: 15,   unit: 'box',   unitprice: 14.00,  reorderlevel: 5,   supplier: 'MedPlus Ghana',          suppliercontact: '+233 20 900 1122', location: 'Sick Bay' },
    { name: 'Paracetamol Tablets (500)',   category: 'Medical',       quantity: 8,    unit: 'bottle',unitprice: 18.00,  reorderlevel: 3,   supplier: 'MedPlus Ghana',          suppliercontact: '+233 20 900 1122', location: 'Sick Bay' },
    { name: 'Antiseptic Solution (1L)',    category: 'Medical',       quantity: 10,   unit: 'btl',   unitprice: 9.50,   reorderlevel: 3,   supplier: 'MedPlus Ghana',          suppliercontact: '+233 20 900 1122', location: 'Sick Bay' },
];

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_inventoryitems');
    console.log('══════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing items to skip duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_inventoryitems?$select=sms_inventoryitemid,sms_name`,
        { headers: h, timeout: 30000 }
    );
    const existingNames = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => (r.sms_name ?? '').toLowerCase())
    );
    console.log(`  ${existingNames.size} existing item(s) — skipping duplicates\n`);

    let created = 0, skipped = 0;

    for (const item of ITEMS) {
        if (existingNames.has(item.name.toLowerCase())) {
            console.log(`  [SKIP] ${item.name}`);
            skipped++; continue;
        }

        const payload: Record<string, unknown> = {
            sms_name:            item.name,
            sms_category:        item.category,
            sms_quantity:        item.quantity,
            sms_unit:            item.unit,
            sms_unitprice:       item.unitprice,
            sms_reorderlevel:    item.reorderlevel,
            sms_supplier:        item.supplier,
            sms_suppliercontact: item.suppliercontact,
            sms_location:        item.location,
        };
        if (item.description) payload.sms_description = item.description;

        await axios.post(`${API}/sms_inventoryitems`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${item.name.padEnd(40)} ${item.category}`);
        created++;
    }

    const lowStock = ITEMS.filter(i => i.quantity <= i.reorderlevel).map(i => i.name);

    console.log(`\n✓ Done: ${created} created, ${skipped} skipped`);
    console.log(`  Total items: ${ITEMS.length}`);
    if (lowStock.length) {
        console.log(`  Low stock (${lowStock.length}): ${lowStock.join(', ')}`);
    }
    console.log('');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
