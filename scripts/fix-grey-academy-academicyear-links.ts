/**
 * fix-grey-academy-academicyear-links.ts
 *
 * Task #3 — link Grey Academy's Classes, Enrollments, Fee Structures and
 * Scholarships to the current 2025-2026 academic year, fix the 4 orphan
 * classes (missing gradelevel/teacher), create the missing SHS 1 / SHS 2
 * grade levels, link the orphan "Physics" subject, and assign the
 * unassigned "Community Leaders Scholarship" to a student.
 *
 * Reads scripts/.grey-academy-data.json (produced by dump-grey-academy.ts).
 *
 * Run: npx ts-node --skipProject scripts/fix-grey-academy-academicyear-links.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
import { readFileSync } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const GREY_ACADEMY_ID = '3a5c5d93-b948-f111-bec6-7ced8d6e6816';
const CURRENT_AY_ID   = 'ba93c81c-2e4b-f111-bec6-7ced8d6e6816'; // 2025-2026 (iscurrent=true)

// Existing JHS grade levels
const JHS1_ID = 'b0deb96b-5e3f-f111-bec6-70a8a59a431e';
const JHS3_ID = 'b2deb96b-5e3f-f111-bec6-70a8a59a431e';

// 4 orphan classes
const CLASS_JH1_ROOM2 = '9206c1c0-e334-f111-88b4-7ced8d3bbf70'; // -> JHS1 + Kojo Appiah
const CLASS_GRADE9C   = '2c62089d-1737-f111-88b4-7c1e528d37f4'; // -> JHS3 + Akua Frimpong
const CLASS_GRADE10A  = 'eb325b52-1737-f111-88b4-7c1e528d37f4'; // -> new SHS1 + Nana Amponsah
const CLASS_GRADE11B  = '9bcb0774-1737-f111-88b4-7c1e528d37f4'; // -> new SHS2 + David Appiah

// 4 free teachers
const TEACHER_KOJO_APPIAH    = '750afc17-bc3f-f111-bec6-70a8a59a431e';
const TEACHER_AKUA_FRIMPONG  = '760afc17-bc3f-f111-bec6-70a8a59a431e';
const TEACHER_NANA_AMPONSAH  = '770afc17-bc3f-f111-bec6-70a8a59a431e';
const TEACHER_DAVID_APPIAH   = 'd1771a18-1737-f111-88b4-7c1e528d37f4';

// Orphan subject
const SUBJECT_PHYSICS = '3e13d416-2737-f111-88b4-7c1e528d37f4';

// Unassigned scholarship + candidate student
const SCHOLARSHIP_COMMUNITY_LEADERS = '2e2075f1-593f-f111-bec6-70a8a59a431e';
const STUDENT_KOFI_ASANTE_JR        = '0a32a6ae-c03f-f111-bec6-70a8a59a431e';

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
    console.log('  Fix: Grey Academy academic-year links + orphans');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/.grey-academy-data.json'), 'utf-8'));

    const ayBind = { 'sms_academicyear@odata.bind': `/sms_academicyears(${CURRENT_AY_ID})` };

    // ── 1. Link Classes, Enrollments, Fee Structures, Scholarships to 2025-2026 ──
    console.log('1. Linking Classes -> 2025-2026 academic year');
    {
        const ids: string[] = data.classes.map((c: any) => c.sms_classid);
        const r = await runBatched(ids, 5, async (id) => {
            await client.patch(`sms_classes(${id})`, ayBind);
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${ids.length})`);
    }

    console.log('2. Linking Enrollments -> 2025-2026 academic year');
    {
        const ids: string[] = data.enrollments.map((e: any) => e.sms_enrollmentid);
        const r = await runBatched(ids, 5, async (id) => {
            await client.patch(`sms_enrollments(${id})`, ayBind);
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${ids.length})`);
    }

    console.log('3. Linking Fee Structures -> 2025-2026 academic year');
    {
        const ids: string[] = data.feestructures.map((f: any) => f.sms_feestructureid);
        const r = await runBatched(ids, 5, async (id) => {
            await client.patch(`sms_feestructures(${id})`, ayBind);
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${ids.length})`);
    }

    console.log('4. Linking Scholarships -> 2025-2026 academic year');
    {
        const ids: string[] = data.scholarships.map((s: any) => s.sms_scholarshipid);
        const r = await runBatched(ids, 5, async (id) => {
            await client.patch(`sms_scholarships(${id})`, ayBind);
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${ids.length})`);
    }

    // ── 5. Create SHS 1 / SHS 2 grade levels ──
    console.log('5. Creating SHS 1 / SHS 2 grade levels');
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

    const shs1Res = await client.post('sms_gradelevels', {
        sms_name:        'SHS 1',
        sms_ordernumber: 10,
        'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
    }, ph);
    const SHS1_ID: string = shs1Res.data.sms_gradelevelid;
    console.log(`   ✓ SHS 1 -> ${SHS1_ID.slice(0, 8)}…`);

    const shs2Res = await client.post('sms_gradelevels', {
        sms_name:        'SHS 2',
        sms_ordernumber: 11,
        'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
    }, ph);
    const SHS2_ID: string = shs2Res.data.sms_gradelevelid;
    console.log(`   ✓ SHS 2 -> ${SHS2_ID.slice(0, 8)}…`);

    // ── 6. Fix 4 orphan classes: gradelevel + teacher ──
    console.log('6. Fixing orphan classes (gradelevel + teacher)');
    const classFixes = [
        { classId: CLASS_JH1_ROOM2, gradelevelId: JHS1_ID, teacherId: TEACHER_KOJO_APPIAH,   label: 'JH1 - Room 2 -> JHS 1 / Kojo Appiah' },
        { classId: CLASS_GRADE9C,   gradelevelId: JHS3_ID, teacherId: TEACHER_AKUA_FRIMPONG, label: 'Grade 9-C -> JHS 3 / Akua Frimpong' },
        { classId: CLASS_GRADE10A,  gradelevelId: SHS1_ID, teacherId: TEACHER_NANA_AMPONSAH, label: 'Grade 10-A -> SHS 1 / Nana Amponsah' },
        { classId: CLASS_GRADE11B,  gradelevelId: SHS2_ID, teacherId: TEACHER_DAVID_APPIAH,  label: 'Grade 11-B -> SHS 2 / David Appiah' },
    ];

    for (const f of classFixes) {
        try {
            await client.patch(`sms_classes(${f.classId})`, {
                'sms_gradelevel@odata.bind': `/sms_gradelevels(${f.gradelevelId})`,
                'sms_teacher@odata.bind':    `/sms_teachers(${f.teacherId})`,
            });
            console.log(`   ✓ ${f.label}`);
        } catch (err: any) {
            console.error(`   ✗ ${f.label}: ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
        }
    }

    // ── 7. Reciprocally link each teacher's class ──
    console.log('7. Linking teachers -> their class (reciprocal)');
    for (const f of classFixes) {
        try {
            await client.patch(`sms_teachers(${f.teacherId})`, {
                'sms_class@odata.bind': `/sms_classes(${f.classId})`,
            });
            console.log(`   ✓ ${f.label.split(' -> ')[1]} <- class`);
        } catch (err: any) {
            console.error(`   ✗ ${f.label}: ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
        }
    }

    // ── 8. Link orphan "Physics" subject ──
    console.log('8. Linking "Physics" subject -> SHS 1 / Nana Amponsah');
    try {
        await client.patch(`sms_subjects(${SUBJECT_PHYSICS})`, {
            'sms_gradelevel@odata.bind': `/sms_gradelevels(${SHS1_ID})`,
            'sms_teacher@odata.bind':    `/sms_teachers(${TEACHER_NANA_AMPONSAH})`,
        });
        console.log('   ✓ done');
    } catch (err: any) {
        console.error(`   ✗ ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
    }

    // ── 9. Assign "Community Leaders Scholarship" -> Kofi Asante Jr ──
    console.log('9. Assigning "Community Leaders Scholarship" -> Kofi Asante Jr');
    try {
        await client.patch(`sms_scholarships(${SCHOLARSHIP_COMMUNITY_LEADERS})`, {
            'sms_student@odata.bind': `/sms_students(${STUDENT_KOFI_ASANTE_JR})`,
        });
        console.log('   ✓ done');
    } catch (err: any) {
        console.error(`   ✗ ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
