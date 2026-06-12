/**
 * seed-grey-academy-exam-results.ts
 *
 * Task #10 — seed sms_examresults for Grey Academy's 6 exams (audit found 0
 * exam result records total).
 *
 * Exam roster:
 *  1. Term 1 Science Quiz       (Grade 9-C, total=20, pass=10)  -> Grade 9-C students
 *  2. Term 1 Science Lab Pract. (Grade 9-C, total=50, pass=25)  -> Grade 9-C students
 *  3. Term 3 Art & Design Pract.(Grade 10-A, total=50, pass=25) -> Grade 10-A students
 *  4. Mid-Term Examinations     (no class link, total/pass null) -> all 40 students
 *  5. Final Term Examinations   (no class link, total/pass null) -> all 40 students
 *  6. Mock Examinations         (no class link, total/pass null) -> all 40 students
 *
 * For exams 4-6 (whole-school, no class/subject), sms_totalmarks/sms_passmarks
 * are first PATCHed to 100/50 so the server-calculated sms_percentage and
 * sms_ispassed fields on exam results compute meaningfully.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-exam-results.ts
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

const EXAM_SCIENCE_QUIZ = '9c328b77-2a3e-f111-bec6-70a8a59a431e';  // Term 1 Science Quiz, total=20 pass=10
const EXAM_SCIENCE_PRAC = '9e328b77-2a3e-f111-bec6-70a8a59a431e';  // Term 1 Science Lab Practical, total=50 pass=25
const EXAM_ART_PRAC     = 'a9328b77-2a3e-f111-bec6-70a8a59a431e';  // Term 3 Art & Design Practical, total=50 pass=25
const EXAM_MIDTERM      = 'b7c1c342-6d37-f111-88b4-7c1e528d37f4';  // Mid-Term Examinations
const EXAM_FINAL        = '4b2525a4-6d37-f111-88b4-7c1e528d37f4';  // Final Term Examinations
const EXAM_MOCK         = '0f3a23c5-6d37-f111-88b4-7c1e528d37f4';  // Mock Examinations

// All 40 students (full GUIDs from live audit, ordered by class)
const ALL_STUDENTS: { id: string; name: string }[] = [
    { id: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', name: 'Karen Appiah' },       // Grade 10-A
    { id: '74f6928c-e034-f111-88b4-7ced8d3bbf70', name: 'Emilia Lawson' },      // Grade 10-A
    { id: '57893d40-d634-f111-88b4-7ced8d3bbf70', name: 'James Bond' },         // Grade 11-B
    { id: '77d04ebb-8332-f111-88b4-7ced8d706811', name: 'Mikel Shawn' },        // Grade 9-C
    { id: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Kekeli Adjei' },       // JHS 1A
    { id: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Linda Darko' },        // JHS 1A
    { id: 'd0fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Michael Nkrumah' },    // JHS 1A
    { id: 'd1fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Nancy Osei' },         // JHS 1A
    { id: 'd2fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Oscar Amankwah' },     // JHS 2A
    { id: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Rachel Amponsah' },    // JHS 2A
    { id: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Patricia Appiah' },    // JHS 2A
    { id: 'd4fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Quentin Frimpong' },   // JHS 2A
    { id: 'd6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Samuel Agyei' },       // JHS 3A
    { id: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Theresa Bediako' },    // JHS 3A
    { id: 'd8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Uriah Quaye' },        // JHS 3A
    { id: 'd9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Vivian Tetteh' },      // JHS 3A
    { id: '0a32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kofi Asante Jr' },     // Primary 1A
    { id: '0c32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwame Boateng' },      // Primary 1A
    { id: '0b32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Ama Mensah' },         // Primary 1A
    { id: '0d32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Abena Owusu' },        // Primary 1A
    { id: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Yaw Adjei' },          // Primary 2A
    { id: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akua Darko' },         // Primary 2A
    { id: '1032a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kojo Nkrumah' },       // Primary 2A
    { id: '1132a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Efua Osei' },          // Primary 2A
    { id: '1232a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwabena Amankwah' },   // Primary 3A
    { id: '1532a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Nana Amponsah' },      // Primary 3A
    { id: '1332a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Adwoa Appiah' },       // Primary 3A
    { id: '1432a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Fiifi Frimpong' },     // Primary 3A
    { id: '1632a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akosua Agyei' },       // Primary 4A
    { id: '1732a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Emmanuel Bediako' },   // Primary 4A
    { id: '1832a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Gifty Quaye' },        // Primary 4A
    { id: '1932a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Bright Tetteh' },      // Primary 4A
    { id: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Courage Acheampong' }, // Primary 5A
    { id: 'c9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Felix Adusei' },       // Primary 5A
    { id: 'c6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Bernice Asiedu' },     // Primary 5A
    { id: 'c8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Doris Kumi' },         // Primary 5A
    { id: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Gloria Asante' },      // Primary 6A
    { id: 'ccfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Irene Boateng' },      // Primary 6A
    { id: 'cbfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Herman Mensah' },      // Primary 6A
    { id: 'cdfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'John Owusu' },         // Primary 6A
];

const GRADE9C_STUDENTS  = ALL_STUDENTS.filter((s) => s.id === '77d04ebb-8332-f111-88b4-7ced8d706811');
const GRADE10A_STUDENTS = ALL_STUDENTS.filter((s) => ['fe4f35f5-843d-f111-bec6-70a8a59a431e', '74f6928c-e034-f111-88b4-7ced8d3bbf70'].includes(s.id));

interface ResultJob { examid: string; examname: string; studentid: string; studentname: string; score: number; totalmarks: number; }
const JOBS: ResultJob[] = [];

// ── Exams 1-3: class/subject-specific, fixed scores ──
JOBS.push({ examid: EXAM_SCIENCE_QUIZ, examname: 'Term 1 Science Quiz', studentid: GRADE9C_STUDENTS[0].id, studentname: GRADE9C_STUDENTS[0].name, score: 16, totalmarks: 20 });
JOBS.push({ examid: EXAM_SCIENCE_PRAC, examname: 'Term 1 Science Lab Practical', studentid: GRADE9C_STUDENTS[0].id, studentname: GRADE9C_STUDENTS[0].name, score: 43, totalmarks: 50 });
JOBS.push({ examid: EXAM_ART_PRAC, examname: 'Term 3 Art & Design Practical', studentid: GRADE10A_STUDENTS[0].id, studentname: GRADE10A_STUDENTS[0].name, score: 46, totalmarks: 50 }); // Karen Appiah
JOBS.push({ examid: EXAM_ART_PRAC, examname: 'Term 3 Art & Design Practical', studentid: GRADE10A_STUDENTS[1].id, studentname: GRADE10A_STUDENTS[1].name, score: 39, totalmarks: 50 }); // Emilia Lawson

// ── Exams 4-6: whole-school, deterministic scores out of 100 ──
function pickScore(seed: number, base: number, spread: number): number {
    const r = (Math.sin(seed) + 1) / 2; // 0..1
    return Math.max(20, Math.min(100, Math.round(base + (r - 0.5) * 2 * spread)));
}
const SCHOOLWIDE_EXAMS: { examid: string; examname: string; offset: number; base: number; spread: number }[] = [
    { examid: EXAM_MIDTERM, examname: 'Mid-Term Examinations', offset: 1, base: 68, spread: 25 },
    { examid: EXAM_FINAL,   examname: 'Final Term Examinations', offset: 2, base: 72, spread: 23 },
    { examid: EXAM_MOCK,    examname: 'Mock Examinations', offset: 3, base: 70, spread: 24 },
];
SCHOOLWIDE_EXAMS.forEach((exam) => {
    ALL_STUDENTS.forEach((s, si) => {
        const score = pickScore(si * 7 + exam.offset, exam.base, exam.spread);
        JOBS.push({ examid: exam.examid, examname: exam.examname, studentid: s.id, studentname: s.name, score, totalmarks: 100 });
    });
});

function gradeFromPercent(pct: number): string {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 75) return 'B+';
    if (pct >= 70) return 'B';
    if (pct >= 65) return 'C+';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
}
function remarkFromPercent(pct: number): string {
    if (pct >= 90) return 'Outstanding performance.';
    if (pct >= 80) return 'Excellent work, keep it up.';
    if (pct >= 75) return 'Very good effort, well done.';
    if (pct >= 70) return 'Good result, continue working hard.';
    if (pct >= 60) return 'Satisfactory, with room for improvement.';
    if (pct >= 50) return 'Passed, but needs more focus and revision.';
    return 'Needs significant improvement and extra support.';
}

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
    console.log('  Seed: Grey Academy Exam Results');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // ── 1. Set totalmarks/passmarks on the 3 whole-school exams ──
    console.log('1. Setting totalmarks=100 / passmarks=50 on whole-school exams');
    for (const exam of SCHOOLWIDE_EXAMS) {
        await client.patch(`sms_exams(${exam.examid})`, { sms_totalmarks: 100, sms_passmarks: 50 });
        console.log(`   ✓ ${exam.examname}`);
    }

    // ── 2. Create exam results ──
    console.log(`2. Creating ${JOBS.length} exam result records`);
    const r = await runBatched(JOBS, 5, async (j) => {
        const pct = (j.score / j.totalmarks) * 100;
        await client.post('sms_examresults', {
            sms_name: `${j.studentname} - ${j.examname}`,
            sms_score: j.score,
            sms_gradeletter: gradeFromPercent(pct),
            sms_remarks: remarkFromPercent(pct),
            'sms_exam@odata.bind':    `/sms_exams(${j.examid})`,
            'sms_student@odata.bind': `/sms_students(${j.studentid})`,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        });
    });
    console.log(`   ${r.success} ok, ${r.failed} failed (of ${JOBS.length})`);

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
