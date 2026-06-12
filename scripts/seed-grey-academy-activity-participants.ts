/**
 * seed-grey-academy-activity-participants.ts
 *
 * Task #6 — seed sms_activityparticipants for Grey Academy's 18 extracurricular
 * activities (audit found only 1 participant record total). Each of the 40
 * students is enrolled in 2 clubs, spread across categories via a fixed
 * round-robin offset (index i and i+7 mod 18) so every club gets participants.
 * Skips any (student, activity) pair that already exists.
 *
 * Note: sms_activityid / sms_activityname on sms_activityparticipants are
 * plain string fields (not true lookups) — no @odata.bind needed for them.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-activity-participants.ts
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
const ENROLLMENT_DATE = '2025-09-15';

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
    console.log('  Seed: Grey Academy Activity Participants');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);
    const f = `_sms_school_value eq ${GREY_ACADEMY_ID}`;

    const students = await getAll<{ sms_studentid: string; sms_firstname: string; sms_lastname: string }>(
        client, `sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$filter=${f}&$orderby=sms_lastname,sms_firstname`,
    );
    const activities = await getAll<{ sms_activityid: string; sms_name: string }>(
        client, `sms_activities?$select=sms_activityid,sms_name&$filter=${f}&$orderby=sms_name`,
    );
    const existing = await getAll<{ _sms_student_value: string; sms_activityid: string }>(
        client, `sms_activityparticipants?$select=_sms_student_value,sms_activityid&$filter=${f}`,
    );

    const existingPairs = new Set(existing.map((e) => `${e._sms_student_value}|${e.sms_activityid}`));

    console.log(`${students.length} students x 2 clubs, ${activities.length} activities, ${existing.length} existing participant(s)\n`);

    const jobs: { studentId: string; studentName: string; activityId: string; activityName: string }[] = [];
    students.forEach((s, i) => {
        const offsets = [i % activities.length, (i + 7) % activities.length];
        for (const idx of offsets) {
            const a = activities[idx];
            const key = `${s.sms_studentid}|${a.sms_activityid}`;
            if (existingPairs.has(key)) continue;
            existingPairs.add(key); // avoid double-adding if offsets collide for small lists
            jobs.push({
                studentId: s.sms_studentid,
                studentName: `${s.sms_firstname} ${s.sms_lastname}`,
                activityId: a.sms_activityid,
                activityName: a.sms_name,
            });
        }
    });

    console.log(`Creating ${jobs.length} new participant records...`);
    const r = await runBatched(jobs, 5, async (j) => {
        await client.post('sms_activityparticipants', {
            sms_name:           `${j.studentName} – ${j.activityName}`,
            sms_activityid:     j.activityId,
            sms_activityname:   j.activityName,
            'sms_student@odata.bind': `/sms_students(${j.studentId})`,
            sms_enrollmentdate: ENROLLMENT_DATE,
            sms_activityparticipantstatus: 1,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        });
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
