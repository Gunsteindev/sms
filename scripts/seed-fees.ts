/**
 * seed-fees.ts — Seeds Ghana Basic Education fee data for 2024–2025.
 *
 * Data model (Dataverse):
 *   sms_feestructures  — fee type definitions per grade level
 *   sms_fees           — invoices (one per student × fee structure)
 *   sms_feepayments    — payment transactions (links to sms_fees via sms_fee lookup)
 *
 * sms_feetype valid range: 1–4 (Tuition, Books, Uniform, Transport)
 * sms_feestatus: 1=Pending, 2=Paid
 * sms_paymentmethod: 1=Cash, 2=Bank Transfer, 4=Mobile Money
 * sms_paymentstatus: 1=Paid, 2=Pending
 *
 * Run: npm run seed:fees
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

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

function hdr(tok: string) {
    return { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0', Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' };
}
function phdr(tok: string) {
    return { ...hdr(tok), 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Fee schedule (GHS 2024–2025, feetype 1–4 only) ─────────────────────────

function gradeLabel(n: number) { return n <= 6 ? `P${n}` : `JHS ${n - 6}`; }

interface FeeSpec { name: string; feetype: number; amount: number; duedate: string; order: number; }

function feesForGrade(order: number): FeeSpec[] {
    const p   = order <= 6;
    const lbl = gradeLabel(order);
    return [
        { name: `Tuition Fee – ${lbl} (Term 1 2024/25)`,    feetype: 1, amount: p ? 600 + (order - 1) * 50 : 1000 + (order - 7) * 150, duedate: '2024-09-15', order },
        { name: `Books & Stationery – ${lbl} 2024/25`,      feetype: 2, amount: p ? 160 : 250, duedate: '2024-09-20', order },
        { name: `School Uniform – ${lbl} 2024/25`,          feetype: 3, amount: p ? 120 : 150, duedate: '2024-09-20', order },
        { name: `Transport Levy – ${lbl} (Term 1 2024/25)`, feetype: 4, amount: p ? 250 : 300, duedate: '2024-09-15', order },
    ];
}

// ─── Payment helpers ─────────────────────────────────────────────────────────

function rndDate(from: string, to: string): string {
    const f = new Date(from).getTime(), t = new Date(to).getTime();
    return new Date(f + Math.random() * (t - f)).toISOString().slice(0, 10);
}
function momoRef(): string {
    return `GH-MOMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
}
function rcpt(date: string): string {
    return `RCP-${date.replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
}
// 60% Mobile Money, 25% Cash, 15% Bank Transfer
function pickMethod(): number { const r = Math.random(); return r < 0.60 ? 4 : r < 0.85 ? 1 : 2; }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('=== Seed Fees — Ghana Basic Education 2024/25 ===\n');
    const tok = await getToken();
    console.log('Token OK.');

    // ── 1. Resolve academic year 2024-2025 ────────────────────────────────
    console.log('\n[1/6] Resolving academic year…');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ayRes = await axios.get<any>(
        `${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$filter=contains(sms_name,'2024')`,
        { headers: hdr(tok), timeout: 20000 }
    );
    let ayId: string;
    if (ayRes.data.value?.length > 0) {
        ayId = ayRes.data.value[0].sms_academicyearid;
        console.log(`  Found: "${ayRes.data.value[0].sms_name}" → ${ayId}`);
    } else {
        console.log('  Creating academic year 2024-2025…');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cr = await axios.post<any>(
            `${API}/sms_academicyears`,
            { sms_name: '2024-2025', sms_startdate: '2024-09-01', sms_enddate: '2025-07-31', sms_iscurrent: false },
            { headers: phdr(tok), timeout: 20000 }
        );
        ayId = cr.data?.sms_academicyearid ?? cr.headers['odata-entityid']?.match(/\(([^)]+)\)$/)?.[1] ?? '';
        console.log(`  Created → ${ayId}`);
    }

    // ── 2. Fetch grade levels ──────────────────────────────────────────────
    console.log('\n[2/6] Fetching grade levels…');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const glRes = await axios.get<any>(`${API}/sms_gradelevels?$select=sms_gradelevelid,sms_ordernumber&$top=50`, { headers: hdr(tok), timeout: 20000 });
    const glIdByOrder: Record<number, string> = {};
    const glMap: Record<string, number>       = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const g of glRes.data.value ?? []) {
        const id = g.sms_gradelevelid as string, ord = (g.sms_ordernumber as number) ?? 0;
        if (ord > 0) { glIdByOrder[ord] = id; glMap[id] = ord; }
    }
    console.log(`  ${Object.keys(glIdByOrder).length} grade levels mapped`);

    // ── 3. Create/verify fee structures ───────────────────────────────────
    console.log('\n[3/6] Resolving fee structures…');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existFSRes = await axios.get<any>(`${API}/sms_feestructures?$select=sms_feestructureid,sms_name&$top=300`, { headers: hdr(tok), timeout: 20000 });
    const existFS = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const f of existFSRes.data.value ?? []) existFS.set(f.sms_name, f.sms_feestructureid as string);

    const fsIds: Record<number, Record<number, string>> = {};
    for (let g = 1; g <= 9; g++) fsIds[g] = {};
    let fsCreated = 0;

    for (let order = 1; order <= 9; order++) {
        for (const spec of feesForGrade(order)) {
            if (existFS.has(spec.name)) {
                fsIds[order][spec.feetype] = existFS.get(spec.name)!;
                continue;
            }
            const glId = glIdByOrder[order];
            const payload: Record<string, unknown> = {
                sms_name: spec.name, sms_feetype: spec.feetype, sms_amount: spec.amount, sms_duedate: spec.duedate,
                'sms_academicyear@odata.bind': `/sms_academicyears(${ayId})`,
            };
            if (glId) payload['sms_gradelevel@odata.bind'] = `/sms_gradelevels(${glId})`;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r = await axios.post<any>(`${API}/sms_feestructures`, payload, { headers: phdr(tok), timeout: 20000 });
                const id: string = r.data?.sms_feestructureid ?? r.headers['odata-entityid']?.match(/\(([^)]+)\)$/)?.[1] ?? '';
                fsIds[order][spec.feetype] = id;
                existFS.set(spec.name, id);
                fsCreated++;
                await delay(120);
            } catch (e: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error(`\n  ✗ ${spec.name}: ${(e as any).response?.data?.error?.message ?? (e as any).message}`);
            }
        }
    }
    console.log(`  ${fsCreated} new fee structures, ${existFS.size - fsCreated} already existed`);

    // ── 4. Fetch students ──────────────────────────────────────────────────
    console.log('\n[4/6] Fetching students…');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stuRes = await axios.get<any>(
        `${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname,_sms_gradelevel_value&$top=500&$orderby=sms_firstname asc`,
        { headers: hdr(tok), timeout: 30000 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students: any[] = stuRes.data.value ?? [];
    console.log(`  ${students.length} students found`);

    // ── 5. Create invoices (sms_fees) ──────────────────────────────────────
    console.log('\n[5/6] Creating fee invoices (sms_fees)…');

    // Check existing invoices (student+feestructure pairs)
    const existInv = new Map<string, string>(); // "stuId|fsId" → invoiceId
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invRes = await axios.get<any>(
            `${API}/sms_fees?$select=sms_feeid,_sms_student_value,_sms_feestructure_value&$top=500`,
            { headers: hdr(tok), timeout: 30000 }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const inv of invRes.data.value ?? []) {
            existInv.set(`${inv._sms_student_value}|${inv._sms_feestructure_value}`, inv.sms_feeid as string);
        }
        console.log(`  ${existInv.size} existing invoices`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.warn(`  ⚠ Could not load existing invoices: ${(e as any).response?.data?.error?.message ?? (e as any).message}`);
    }

    // invoiceId lookup: "stuId|fsId" → invoiceId (includes newly created)
    const invoiceIds = new Map<string, string>(existInv);
    let invCreated = 0;

    for (let i = 0; i < students.length; i++) {
        const stu   = students[i];
        const stuId = stu.sms_studentid as string;
        const name  = `${(stu.sms_firstname as string) ?? ''} ${(stu.sms_lastname as string) ?? ''}`.trim();
        const glId  = stu._sms_gradelevel_value as string | undefined;
        const order = glId && glMap[glId] ? glMap[glId] : ((i % 6) + 1);
        const ss    = fsIds[order] ?? fsIds[1];
        const specs = feesForGrade(order);

        for (const spec of specs) {
            const fsId = ss[spec.feetype];
            if (!fsId) continue;
            const key = `${stuId}|${fsId}`;
            if (invoiceIds.has(key)) continue;

            // Invoice status: ft1 (Tuition) 10% pending, ft3 (Uniform) 15% pending, ft4 (Transport) 20% pending, ft2 (Books) all paid
            let feestatus = 2; // 2=Paid
            if (spec.feetype === 1 && i % 10 === 9) feestatus = 1;
            else if (spec.feetype === 3 && i % 20 >= 15) feestatus = 1;
            else if (spec.feetype === 4 && i % 10 >= 7) feestatus = 1;

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r = await axios.post<any>(`${API}/sms_fees`, {
                    sms_name: `${name} – ${spec.name}`,
                    'sms_student@odata.bind':      `/sms_students(${stuId})`,
                    'sms_feestructure@odata.bind': `/sms_feestructures(${fsId})`,
                    sms_amount:    spec.amount,
                    sms_duedate:   spec.duedate,
                    sms_feestatus: feestatus,
                    'sms_academicyear@odata.bind': `/sms_academicyears(${ayId})`,
                }, { headers: phdr(tok), timeout: 20000 });

                const invId: string = r.data?.sms_feeid ?? r.headers['odata-entityid']?.match(/\(([^)]+)\)$/)?.[1] ?? '';
                if (invId) {
                    invoiceIds.set(key, invId);
                    invCreated++;
                    process.stdout.write(`\r  ${invCreated} invoices created…`);
                }
                await delay(100);
            } catch (e: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error(`\n  ✗ Invoice ${name} ft${spec.feetype}: ${(e as any).response?.data?.error?.message ?? (e as any).message}`);
            }
        }
    }
    console.log(`\n  Done: ${invCreated} invoices created, ${existInv.size} already existed`);

    // ── 6. Create payments (sms_feepayments) for paid invoices ─────────────
    console.log('\n[6/6] Creating fee payments (sms_feepayments)…');

    const existPay = new Set<string>(); // "invoiceId" — one payment per invoice
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pyRes = await axios.get<any>(
            `${API}/sms_feepayments?$select=sms_feepaymentid,_sms_fee_value&$top=500`,
            { headers: hdr(tok), timeout: 30000 }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of pyRes.data.value ?? []) if (p._sms_fee_value) existPay.add(p._sms_fee_value as string);
        console.log(`  ${existPay.size} existing payments (will skip)`);
    } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.warn(`  ⚠ Could not load existing payments: ${(e as any).response?.data?.error?.message ?? (e as any).message}`);
    }

    let payCreated = 0, paySkipped = 0;

    for (let i = 0; i < students.length; i++) {
        const stu   = students[i];
        const stuId = stu.sms_studentid as string;
        const name  = `${(stu.sms_firstname as string) ?? ''} ${(stu.sms_lastname as string) ?? ''}`.trim();
        const glId  = stu._sms_gradelevel_value as string | undefined;
        const order = glId && glMap[glId] ? glMap[glId] : ((i % 6) + 1);
        const ss    = fsIds[order] ?? fsIds[1];
        const specs = feesForGrade(order);

        for (const spec of specs) {
            const fsId = ss[spec.feetype];
            if (!fsId) continue;
            const invId = invoiceIds.get(`${stuId}|${fsId}`);
            if (!invId) continue;

            // Only create payment for paid invoices (feestatus=2)
            const isPaid = !(
                (spec.feetype === 1 && i % 10 === 9) ||
                (spec.feetype === 3 && i % 20 >= 15) ||
                (spec.feetype === 4 && i % 10 >= 7)
            );
            if (!isPaid) { paySkipped++; continue; }
            if (existPay.has(invId)) { paySkipped++; continue; }

            const method = spec.feetype === 4 ? 4 : pickMethod();
            const date   = rndDate('2024-09-01', '2024-11-30');
            const txId   = method === 4 ? momoRef() : undefined;

            try {
                await axios.post(`${API}/sms_feepayments`, {
                    sms_name:            `${name} – ${spec.name.replace(/–.*/, '').trim()} ${date}`,
                    'sms_student@odata.bind': `/sms_students(${stuId})`,
                    'sms_fee@odata.bind':     `/sms_fees(${invId})`,
                    sms_amount:          spec.amount,
                    sms_paymentdate:     date,
                    sms_paymentmethod:   method,
                    sms_paymentstatus:   1,  // 1=Paid
                    sms_receiptnumber:   rcpt(date),
                    ...(txId ? { sms_transactionid: txId } : {}),
                }, { headers: phdr(tok), timeout: 20000 });

                existPay.add(invId);
                payCreated++;
                process.stdout.write(`\r  ${payCreated} payments created (${paySkipped} pending/skipped)…`);
                await delay(100);
            } catch (e: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error(`\n  ✗ Payment ${name} ft${spec.feetype}: ${(e as any).response?.data?.error?.message ?? (e as any).message}`);
            }
        }
    }

    console.log(`\n  Done: ${payCreated} payments created, ${paySkipped} pending invoices (no payment)`);
    console.log('\n✓ Seed complete!');
}

main().catch(e => { console.error('\n✗ Fatal:', (e as Error).message ?? e); process.exit(1); });
