/**
 * seed-grey-academy-attendance.ts
 *
 * Task #7 — seed sms_attendances for Grey Academy's current term (Term 3,
 * 2026-04-20..2026-07-31, which contains "today"). Audit found only 3
 * attendance records total. Seeds daily roll-call attendance for all 40
 * students across the last 10 school days (weekdays), linked to each
 * student's current class.
 *
 * Skips any (student, date) pair that already has a record.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-attendance.ts
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
const SCHOOL_DAYS = 10; // last 2 weeks of weekdays

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

// Last N weekdays (Mon-Fri), ending today (or the most recent weekday on/before today)
function lastSchoolDays(n: number): string[] {
    const days: string[] = [];
    const d = new Date();
    while (days.length < n) {
        const dow = d.getUTCDay(); // 0=Sun, 6=Sat
        if (dow !== 0 && dow !== 6) {
            days.push(d.toISOString().slice(0, 10));
        }
        d.setUTCDate(d.getUTCDate() - 1);
    }
    return days.reverse();
}

// Deterministic pseudo-random status: 90% present, 4% absent, 4% late, 2% excused
function pickStatus(seed: number): number {
    const r = (Math.sin(seed) + 1) / 2; // 0..1
    if (r < 0.90) return 1; // Present
    if (r < 0.94) return 2; // Absent
    if (r < 0.98) return 3; // Late
    return 4; // Excused
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: Grey Academy Attendance (current term)');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);
    const f = `_sms_school_value eq ${GREY_ACADEMY_ID}`;

    const students = await getAll<{ sms_studentid: string; _sms_class_value: string | null }>(
        client, `sms_students?$select=sms_studentid,_sms_class_value&$filter=${f}`,
    );
    const existing = await getAll<{ _sms_student_value: string; sms_date: string }>(
        client, `sms_attendances?$select=_sms_student_value,sms_date&$filter=${f}`,
    );
    const existingPairs = new Set(existing.map((e) => `${e._sms_student_value}|${e.sms_date.slice(0, 10)}`));

    const days = lastSchoolDays(SCHOOL_DAYS);
    console.log(`Days: ${days.join(', ')}`);
    console.log(`${students.length} students x ${days.length} days, ${existing.length} existing record(s)\n`);

    const jobs: { studentId: string; classId: string | null; date: string; status: number }[] = [];
    students.forEach((s, si) => {
        days.forEach((date, di) => {
            const key = `${s.sms_studentid}|${date}`;
            if (existingPairs.has(key)) return;
            jobs.push({ studentId: s.sms_studentid, classId: s._sms_class_value, date, status: pickStatus(si * 31 + di) });
        });
    });

    console.log(`Creating ${jobs.length} attendance records...`);
    const r = await runBatched(jobs, 5, async (j) => {
        const payload: Record<string, unknown> = {
            sms_date: j.date,
            sms_attendancestatus: j.status,
            'sms_student@odata.bind': `/sms_students(${j.studentId})`,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        };
        if (j.classId) payload['sms_class@odata.bind'] = `/sms_classes(${j.classId})`;
        await client.post('sms_attendances', payload);
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
