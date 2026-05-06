/**
 * seed-staffleave.ts — Populates sms_staffleaves with realistic leave records.
 * Fetches actual employee IDs from sms_employees and maps names to them.
 * Falls back to placeholder IDs if no employees are seeded yet.
 * Safe to re-run (skips existing records by employeeid+startdate).
 * Run: npx tsx scripts/seed-staffleave.ts
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

// LeaveType: 1=Annual, 2=Sick, 3=Maternity/Paternity, 4=Compassionate, 5=Study, 6=Unpaid
// Status:    1=Pending, 2=Approved, 3=Rejected, 4=Cancelled
interface LeaveSpec {
    employeename: string; leavetype: number; startdate: string; enddate: string;
    reason: string; status: number; approvedby: string; comments?: string;
}

const LEAVES: LeaveSpec[] = [
    // ── Approved ─────────────────────────────────────────────────────────────────
    { employeename: 'Akosua Mensah',    leavetype: 1, startdate: '2025-10-06', enddate: '2025-10-17', reason: 'Family vacation — annual leave entitlement', status: 2, approvedby: 'Emmanuel Owusu-Ansah' },
    { employeename: 'Kofi Asante',      leavetype: 2, startdate: '2025-10-13', enddate: '2025-10-15', reason: 'Acute malaria — doctor\'s certificate attached', status: 2, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Covered by Yaw Darko for Form 2 classes' },
    { employeename: 'Abena Boateng',    leavetype: 3, startdate: '2025-11-03', enddate: '2026-02-28', reason: 'Maternity leave — expected delivery November 2025', status: 2, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Replacement teacher assigned for the duration' },
    { employeename: 'Kwame Owusu',      leavetype: 5, startdate: '2025-11-10', enddate: '2025-11-21', reason: 'Ghana Education Service in-service training — Mathematics', status: 2, approvedby: 'Emmanuel Owusu-Ansah', comments: 'GES-sponsored professional development programme' },
    { employeename: 'Ama Adjei',        leavetype: 4, startdate: '2025-11-17', enddate: '2025-11-19', reason: 'Bereavement — death of grandmother', status: 2, approvedby: 'Abena Osei-Bonsu', comments: 'Condolences extended from management' },
    { employeename: 'Yaw Darko',        leavetype: 1, startdate: '2025-12-08', enddate: '2025-12-19', reason: 'Annual leave — end of year holiday', status: 2, approvedby: 'Emmanuel Owusu-Ansah' },
    { employeename: 'Efua Nkrumah',     leavetype: 2, startdate: '2025-12-01', enddate: '2025-12-03', reason: 'Severe migraine — GP consultation note provided', status: 2, approvedby: 'Abena Osei-Bonsu' },
    { employeename: 'Kojo Appiah',      leavetype: 5, startdate: '2026-01-05', enddate: '2026-01-09', reason: 'University of Ghana short course — School Administration', status: 2, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Certificate of attendance required on return' },
    { employeename: 'Adwoa Frimpong',   leavetype: 1, startdate: '2026-01-12', enddate: '2026-01-23', reason: 'Annual leave — personal travel', status: 2, approvedby: 'Emmanuel Owusu-Ansah' },
    { employeename: 'Kwabena Osei',     leavetype: 4, startdate: '2026-01-20', enddate: '2026-01-22', reason: 'Compassionate leave — father hospitalised', status: 2, approvedby: 'Abena Osei-Bonsu' },
    { employeename: 'Emmanuel Asiedu',  leavetype: 1, startdate: '2025-09-22', enddate: '2025-09-26', reason: 'Annual leave entitlement', status: 2, approvedby: 'Emmanuel Owusu-Ansah' },
    { employeename: 'Grace Amankwah',   leavetype: 2, startdate: '2025-10-27', enddate: '2025-10-28', reason: 'Sick leave — viral fever', status: 2, approvedby: 'Abena Osei-Bonsu' },

    // ── Pending ──────────────────────────────────────────────────────────────────
    { employeename: 'Akua Asare',       leavetype: 1, startdate: '2026-02-16', enddate: '2026-02-27', reason: 'Annual leave — personal trip to Tamale', status: 1, approvedby: '', comments: '' },
    { employeename: 'Nana Acheampong',  leavetype: 6, startdate: '2026-02-23', enddate: '2026-02-27', reason: 'Unpaid leave — family emergency in Kumasi', status: 1, approvedby: '' },
    { employeename: 'Fiifi Amoah',      leavetype: 2, startdate: '2026-02-24', enddate: '2026-02-25', reason: 'Sick leave — back pain, physiotherapy appointment', status: 1, approvedby: '' },
    { employeename: 'Abla Kpodo',       leavetype: 5, startdate: '2026-03-02', enddate: '2026-03-06', reason: 'Professional development — WAEC marking panel training', status: 1, approvedby: '' },
    { employeename: 'Bright Ofori',     leavetype: 1, startdate: '2026-03-09', enddate: '2026-03-13', reason: 'Annual leave — Easter break travel', status: 1, approvedby: '' },

    // ── Rejected ─────────────────────────────────────────────────────────────────
    { employeename: 'Comfort Acquah',   leavetype: 1, startdate: '2025-11-24', enddate: '2025-12-05', reason: 'Annual leave during end-of-term exams period', status: 3, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Declined — exam invigilation required; may re-apply after December 20' },
    { employeename: 'Kofi Asante',      leavetype: 6, startdate: '2025-12-15', enddate: '2025-12-31', reason: 'Extended unpaid leave for personal reasons', status: 3, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Denied — insufficient cover available during closing ceremony period' },

    // ── Cancelled ─────────────────────────────────────────────────────────────────
    { employeename: 'Yaw Darko',        leavetype: 1, startdate: '2025-10-20', enddate: '2025-10-24', reason: 'Annual leave — personal', status: 4, approvedby: 'Emmanuel Owusu-Ansah', comments: 'Cancelled by employee — changed plans' },
];

function daysBetween(start: string, end: string): number {
    return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_staffleaves');
    console.log('══════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch employees to map names → IDs
    // Try several possible collection names (Dataverse auto-pluralises)
    console.log('Fetching employees…');
    let employees: { id: string; name: string }[] = [];
    for (const collection of ['sms_employees', 'sms_employee', 'sms_staffmembers']) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const empRes = await axios.get<any>(
                `${API}/${collection}?$select=sms_employeeid,sms_firstname,sms_lastname&$orderby=sms_firstname asc`,
                { headers: h, timeout: 15000 }
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            employees = (empRes.data.value ?? []).map((e: any) => ({
                id:   e.sms_employeeid,
                name: `${e.sms_firstname ?? ''} ${e.sms_lastname ?? ''}`.trim(),
            }));
            console.log(`  ${employees.length} employee(s) found (via ${collection})\n`);
            break;
        } catch {
            // Try next collection name
        }
    }
    if (employees.length === 0) {
        console.log('  No employees found — leave records will be created without linked employee IDs\n');
    }

    const empMap = new Map<string, string>(); // name (lower) → id
    for (const e of employees) empMap.set(e.name.toLowerCase(), e.id);

    // Fetch existing leave records to skip duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_staffleaves?$select=sms_staffleaveid,sms_employeename,sms_startdate`,
        { headers: h, timeout: 30000 }
    );
    const existingKeys = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) =>
            `${(r.sms_employeename ?? '').toLowerCase()}|${(r.sms_startdate ?? '').slice(0, 10)}`
        )
    );
    console.log(`  ${existingKeys.size} existing record(s) — skipping duplicates\n`);

    const STATUS_LABEL: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Cancelled' };
    const TYPE_LABEL:   Record<number, string> = { 1: 'Annual', 2: 'Sick', 3: 'Maternity/Pat', 4: 'Compassionate', 5: 'Study', 6: 'Unpaid' };
    let created = 0, skipped = 0;

    for (const leave of LEAVES) {
        const key = `${leave.employeename.toLowerCase()}|${leave.startdate}`;
        if (existingKeys.has(key)) {
            console.log(`  [SKIP] ${leave.employeename} (${leave.startdate})`);
            skipped++; continue;
        }

        // Match employee ID (partial/fuzzy match by last name if exact fails)
        let employeeid = empMap.get(leave.employeename.toLowerCase()) ?? '';
        if (!employeeid) {
            const lastName = leave.employeename.split(' ').pop()?.toLowerCase() ?? '';
            const match = employees.find(e => e.name.toLowerCase().includes(lastName));
            if (match) employeeid = match.id;
        }
        // If still no match, use a placeholder (won't link to employee table but record still saves)
        if (!employeeid) employeeid = '00000000-0000-0000-0000-000000000000';

        const days = daysBetween(leave.startdate, leave.enddate);
        const payload: Record<string, unknown> = {
            sms_name:         `${leave.employeename} — ${TYPE_LABEL[leave.leavetype]} Leave`,
            sms_employeeid:   employeeid,
            sms_employeename: leave.employeename,
            sms_leavetype:    leave.leavetype,
            sms_startdate:    leave.startdate,
            sms_enddate:      leave.enddate,
            sms_days:         days,
            sms_reason:       leave.reason,
            sms_status:       leave.status,
        };
        if (leave.approvedby) payload.sms_approvedby = leave.approvedby;
        if (leave.comments)   payload.sms_comments   = leave.comments;

        await axios.post(`${API}/sms_staffleaves`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${leave.employeename.padEnd(22)} ${TYPE_LABEL[leave.leavetype].padEnd(15)} ${leave.startdate} → ${leave.enddate}  (${days}d)  [${STATUS_LABEL[leave.status]}]`);
        created++;
    }

    const pending  = LEAVES.filter(l => l.status === 1).length;
    const approved = LEAVES.filter(l => l.status === 2).length;
    const rejected = LEAVES.filter(l => l.status === 3).length;

    console.log(`\n✓ Done: ${created} created, ${skipped} skipped`);
    console.log(`  Total records : ${LEAVES.length}`);
    console.log(`  Approved      : ${approved}`);
    console.log(`  Pending       : ${pending}`);
    console.log(`  Rejected/Canc : ${rejected + LEAVES.filter(l => l.status === 4).length}`);
    console.log('');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
