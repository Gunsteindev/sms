/**
 * seed-procurement.ts — Populates sms_expenditures with realistic school expenditure records.
 * Covers all 4 statuses (Pending, Approved, Paid, Rejected) and 6 categories.
 * Safe to re-run (skips by name + date).
 * Run: npx tsx scripts/seed-procurement.ts
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

// Category: 1=Supplies, 2=Equipment, 3=Services, 4=Maintenance, 5=Utilities, 6=Other
// Status:   1=Pending,  2=Approved,  3=Paid,     4=Rejected
interface Expenditure {
    name: string; amount: number; category: number; expendituredate: string;
    supplier: string; approvedby: string; status: number; reference: string; notes?: string;
}

const EXPENDITURES: Expenditure[] = [
    // ── Paid ───────────────────────────────────────────────────────────────────
    { name: 'Annual Stationery Purchase',            amount: 3850.00, category: 1, expendituredate: '2025-09-05', supplier: 'Ofori Office Supplies',    approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-001', notes: 'Pens, pencils, exercise books and other stationery for Q1' },
    { name: 'ICT Lab Computers (8 Units)',           amount: 6800.00, category: 2, expendituredate: '2025-09-12', supplier: 'TechZone Accra',           approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-002', notes: 'HP ProDesk 400 G7 desktop computers for ICT expansion' },
    { name: 'School Uniforms — Sports Day',          amount: 1200.00, category: 1, expendituredate: '2025-09-18', supplier: 'Sports World Ghana',       approvedby: 'Abena Osei-Bonsu',     status: 3, reference: 'EXP-2025-003' },
    { name: 'Electricity Bill — September',          amount: 980.50,  category: 5, expendituredate: '2025-09-30', supplier: 'ECG Ghana',                approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-004' },
    { name: 'Water Bill — September',                amount: 340.00,  category: 5, expendituredate: '2025-09-30', supplier: 'GWCL',                     approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-005' },
    { name: 'Library Books — Core Texts',            amount: 4200.00, category: 1, expendituredate: '2025-10-02', supplier: 'Readwide Bookshop',        approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-006', notes: 'Core curriculum textbooks for JHS 1-3' },
    { name: 'School Bus Maintenance',                amount: 1750.00, category: 4, expendituredate: '2025-10-08', supplier: 'AutoCare Workshop',        approvedby: 'Abena Osei-Bonsu',     status: 3, reference: 'EXP-2025-007', notes: 'Full service + brake pad replacement' },
    { name: 'Science Lab Consumables',               amount: 890.00,  category: 1, expendituredate: '2025-10-14', supplier: 'Scilab Ghana',             approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-008', notes: 'Chemicals, test tubes, and Bunsen burner gas' },
    { name: 'Intercom System Installation',          amount: 3200.00, category: 2, expendituredate: '2025-10-20', supplier: 'CommTech Solutions',       approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-009', notes: '12-station intercom for staff communication' },
    { name: 'Electricity Bill — October',            amount: 1045.00, category: 5, expendituredate: '2025-10-31', supplier: 'ECG Ghana',                approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-010' },
    { name: 'Cleaning Supplies — Q1 Stock',          amount: 620.00,  category: 1, expendituredate: '2025-11-03', supplier: 'CleanPro Supplies',        approvedby: 'Abena Osei-Bonsu',     status: 3, reference: 'EXP-2025-011' },
    { name: 'Staff Training — ICT Skills',           amount: 2500.00, category: 3, expendituredate: '2025-11-10', supplier: 'NIIT Ghana',               approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-012', notes: '2-day ICT training for 10 teaching staff' },
    { name: 'Roof Repair — Block B',                 amount: 5400.00, category: 4, expendituredate: '2025-11-15', supplier: 'BuildRight Contractors',   approvedby: 'Emmanuel Owusu-Ansah', status: 3, reference: 'EXP-2025-013', notes: 'Leaking roof panels — 3 classrooms affected' },
    { name: 'Internet Service — Quarterly',          amount: 1800.00, category: 5, expendituredate: '2025-11-20', supplier: 'MTN Business Ghana',       approvedby: 'Abena Osei-Bonsu',     status: 3, reference: 'EXP-2025-014', notes: '50Mbps fibre Q4 2025' },
    { name: 'First Aid & Medical Supplies',          amount: 480.00,  category: 1, expendituredate: '2025-11-25', supplier: 'MedPlus Ghana',            approvedby: 'Abena Osei-Bonsu',     status: 3, reference: 'EXP-2025-015' },

    // ── Approved ────────────────────────────────────────────────────────────────
    { name: 'Projector — Assembly Hall',             amount: 1850.00, category: 2, expendituredate: '2026-01-08', supplier: 'TechZone Accra',           approvedby: 'Emmanuel Owusu-Ansah', status: 2, reference: 'EXP-2026-001', notes: 'Epson EB-W51 WXGA for assembly hall — awaiting delivery' },
    { name: 'Exam Question Paper Printing',          amount: 960.00,  category: 3, expendituredate: '2026-01-12', supplier: 'Printex Ghana Ltd',        approvedby: 'Emmanuel Owusu-Ansah', status: 2, reference: 'EXP-2026-002', notes: 'End-of-term exams — 4 levels × 8 subjects' },
    { name: 'Perimeter Fence Painting',              amount: 2100.00, category: 4, expendituredate: '2026-01-18', supplier: 'PaintCraft Ghana',         approvedby: 'Abena Osei-Bonsu',     status: 2, reference: 'EXP-2026-003' },
    { name: 'Generator Fuel — Term 2',               amount: 1350.00, category: 5, expendituredate: '2026-01-22', supplier: 'Total Energies',           approvedby: 'Emmanuel Owusu-Ansah', status: 2, reference: 'EXP-2026-004', notes: 'Diesel for backup generator — 450 litres' },
    { name: 'Sports Equipment Restock',              amount: 730.00,  category: 1, expendituredate: '2026-02-03', supplier: 'Sports World Ghana',       approvedby: 'Abena Osei-Bonsu',     status: 2, reference: 'EXP-2026-005', notes: 'Footballs, volleyballs, athletics kit' },

    // ── Pending ─────────────────────────────────────────────────────────────────
    { name: 'New Student Desks (30 units)',          amount: 2550.00, category: 2, expendituredate: '2026-02-10', supplier: 'Accra Furniture Works',    approvedby: '',                     status: 1, reference: 'EXP-2026-006', notes: 'Additional desks for expanded JHS 2 intake' },
    { name: 'Staff Welfare — End of Term Event',     amount: 1100.00, category: 6, expendituredate: '2026-02-14', supplier: 'Silverbird Catering',      approvedby: '',                     status: 1, reference: 'EXP-2026-007' },
    { name: 'Security Cameras (CCTV) — Phase 2',    amount: 4800.00, category: 2, expendituredate: '2026-02-18', supplier: 'SecureNet Ghana',          approvedby: '',                     status: 1, reference: 'EXP-2026-008', notes: '8-camera extension to existing CCTV network' },
    { name: 'Annual Pest Control Service',           amount: 380.00,  category: 3, expendituredate: '2026-02-20', supplier: 'SafeGuard Pest Control',   approvedby: '',                     status: 1, reference: 'EXP-2026-009' },
    { name: 'Electricity Bill — January',            amount: 1120.00, category: 5, expendituredate: '2026-02-25', supplier: 'ECG Ghana',                approvedby: '',                     status: 1, reference: 'EXP-2026-010' },

    // ── Rejected ─────────────────────────────────────────────────────────────────
    { name: 'Smart TVs for Classrooms (15 units)',   amount: 12000.00, category: 2, expendituredate: '2025-12-05', supplier: 'TechZone Accra',          approvedby: 'Emmanuel Owusu-Ansah', status: 4, reference: 'EXP-2025-016', notes: 'Rejected — budget exceeded; projectors to be used instead' },
    { name: 'School Minibus Purchase',               amount: 85000.00, category: 2, expendituredate: '2025-12-12', supplier: 'Toyota Ghana',            approvedby: 'Emmanuel Owusu-Ansah', status: 4, reference: 'EXP-2025-017', notes: 'Deferred to next financial year' },
];

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_expenditures');
    console.log('══════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing to skip duplicates (match on reference number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_expenditures?$select=sms_expenditureid,sms_reference`,
        { headers: h, timeout: 30000 }
    );
    const existingRefs = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => (r.sms_reference ?? '').toLowerCase())
    );
    console.log(`  ${existingRefs.size} existing record(s) — skipping duplicates\n`);

    const STATUS_LABEL: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Paid', 4: 'Rejected' };
    let created = 0, skipped = 0;

    for (const exp of EXPENDITURES) {
        if (existingRefs.has(exp.reference.toLowerCase())) {
            console.log(`  [SKIP] ${exp.reference} ${exp.name}`);
            skipped++; continue;
        }

        const payload: Record<string, unknown> = {
            sms_name:            exp.name,
            sms_amount:          exp.amount,
            sms_category:        exp.category,
            sms_expendituredate: exp.expendituredate,
            sms_supplier:        exp.supplier,
            sms_status:          exp.status,
            sms_reference:       exp.reference,
        };
        if (exp.approvedby) payload.sms_approvedby = exp.approvedby;
        if (exp.notes)       payload.sms_notes      = exp.notes;

        await axios.post(`${API}/sms_expenditures`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${exp.reference.padEnd(16)} ${String(exp.amount).padStart(10)} GHS  [${STATUS_LABEL[exp.status]}]  ${exp.name}`);
        created++;
    }

    const total = EXPENDITURES.reduce((s, e) => s + e.amount, 0);
    const paid  = EXPENDITURES.filter(e => e.status === 3).reduce((s, e) => s + e.amount, 0);

    console.log(`\n✓ Done: ${created} created, ${skipped} skipped`);
    console.log(`  Total records : ${EXPENDITURES.length}`);
    console.log(`  Total amount  : GHS ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Paid          : GHS ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log('');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
