/**
 * seed-grey-academy-grades.ts
 *
 * Task #11 (part 2) — seed sms_grades (gradebook entries) for all 39 unique
 * Grey Academy students for the 2025-2026 academic year.
 *
 * Per student, for each subject appropriate to their school level (Primary:
 * English + Mathematics; JHS: English (JHS) + Mathematics (JHS); SHS: Physics
 * only — the lone subject defined for SHS):
 *   - Term 1: Quiz + End of Term
 *   - Term 2: Quiz + End of Term
 *   - Term 3 (in progress): Classwork
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-grades.ts
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
const ACADEMIC_YEAR_2025_2026 = 'ba93c81c-2e4b-f111-bec6-7ced8d6e6816';

const TERM1 = '311b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 1: 2025-09-01 - 2025-12-19
const TERM2 = '321b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 2: 2026-01-05 - 2026-04-03
const TERM3 = '331b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 3: 2026-04-20 - 2026-07-31 (current)

// ── Subjects + teachers ──
const SUBJ_ENG_PRIMARY = '154aaba8-c03f-f111-bec6-70a8a59a431e';
const SUBJ_MTH_PRIMARY = '164aaba8-c03f-f111-bec6-70a8a59a431e';
const SUBJ_ENG_JHS     = '1c4aaba8-c03f-f111-bec6-70a8a59a431e';
const SUBJ_MTH_JHS     = '1d4aaba8-c03f-f111-bec6-70a8a59a431e';
const SUBJ_PHYSICS     = '3e13d416-2737-f111-88b4-7c1e528d37f4';

const TEACHER_ENG_PRIMARY = '675d0910-bc3f-f111-bec6-70a8a59a431e'; // Akosua Mensah
const TEACHER_MTH_PRIMARY = '6d0afc17-bc3f-f111-bec6-70a8a59a431e'; // Kofi Asante
const TEACHER_ENG_JHS     = '730afc17-bc3f-f111-bec6-70a8a59a431e'; // Kwabena Osei
const TEACHER_MTH_JHS     = '720afc17-bc3f-f111-bec6-70a8a59a431e'; // Efua Nkrumah
const TEACHER_PHYSICS     = '770afc17-bc3f-f111-bec6-70a8a59a431e'; // Nana Amponsah

// ── Classes ──
const CLASS_PRIMARY1A  = '780afc17-bc3f-f111-bec6-70a8a59a431e';
const CLASS_PRIMARY2A  = '790afc17-bc3f-f111-bec6-70a8a59a431e';
const CLASS_PRIMARY3A  = 'fc24181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_PRIMARY4A  = 'fd24181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_PRIMARY5A  = 'fe24181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_PRIMARY6A  = 'ff24181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_JHS1A      = '0025181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_JHS2A      = '0125181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_JHS3A      = '0225181e-bc3f-f111-bec6-70a8a59a431e';
const CLASS_GRADE10A   = 'eb325b52-1737-f111-88b4-7c1e528d37f4';
const CLASS_GRADE11B   = '9bcb0774-1737-f111-88b4-7c1e528d37f4';
const CLASS_GRADE9C    = '2c62089d-1737-f111-88b4-7c1e528d37f4';

type Level = 'primary' | 'jhs' | 'shs';

interface StudentEntry { id: string; name: string; classid: string; level: Level }

const STUDENTS: StudentEntry[] = [
    // Primary 1A (3 unique — duplicate enrollment for Abena Owusu collapsed)
    { id: '0d32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Abena Owusu',     classid: CLASS_PRIMARY1A, level: 'primary' },
    { id: '0b32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Ama Mensah',      classid: CLASS_PRIMARY1A, level: 'primary' },
    { id: '0c32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwame Boateng',   classid: CLASS_PRIMARY1A, level: 'primary' },
    // Primary 2A
    { id: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Yaw Adjei',       classid: CLASS_PRIMARY2A, level: 'primary' },
    { id: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akua Darko',      classid: CLASS_PRIMARY2A, level: 'primary' },
    { id: '1032a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kojo Nkrumah',    classid: CLASS_PRIMARY2A, level: 'primary' },
    { id: '1132a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Efua Osei',       classid: CLASS_PRIMARY2A, level: 'primary' },
    // Primary 3A
    { id: '1232a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwabena Amankwah', classid: CLASS_PRIMARY3A, level: 'primary' },
    { id: '1332a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Adwoa Appiah',    classid: CLASS_PRIMARY3A, level: 'primary' },
    { id: '1432a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Fiifi Frimpong',  classid: CLASS_PRIMARY3A, level: 'primary' },
    { id: '1532a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Nana Amponsah',   classid: CLASS_PRIMARY3A, level: 'primary' },
    // Primary 4A
    { id: '1632a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akosua Agyei',    classid: CLASS_PRIMARY4A, level: 'primary' },
    { id: '1732a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Emmanuel Bediako', classid: CLASS_PRIMARY4A, level: 'primary' },
    { id: '1832a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Gifty Quaye',     classid: CLASS_PRIMARY4A, level: 'primary' },
    { id: '1932a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Bright Tetteh',   classid: CLASS_PRIMARY4A, level: 'primary' },
    // Primary 5A
    { id: 'c6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Bernice Asiedu',  classid: CLASS_PRIMARY5A, level: 'primary' },
    { id: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Courage Acheampong', classid: CLASS_PRIMARY5A, level: 'primary' },
    { id: 'c8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Doris Kumi',      classid: CLASS_PRIMARY5A, level: 'primary' },
    { id: 'c9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Felix Adusei',    classid: CLASS_PRIMARY5A, level: 'primary' },
    // Primary 6A
    { id: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Gloria Asante',   classid: CLASS_PRIMARY6A, level: 'primary' },
    { id: 'cbfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Herman Mensah',   classid: CLASS_PRIMARY6A, level: 'primary' },
    { id: 'ccfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Irene Boateng',   classid: CLASS_PRIMARY6A, level: 'primary' },
    { id: 'cdfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'John Owusu',      classid: CLASS_PRIMARY6A, level: 'primary' },
    // JHS 1A
    { id: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Kekeli Adjei',    classid: CLASS_JHS1A, level: 'jhs' },
    { id: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Linda Darko',     classid: CLASS_JHS1A, level: 'jhs' },
    { id: 'd0fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Michael Nkrumah', classid: CLASS_JHS1A, level: 'jhs' },
    { id: 'd1fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Nancy Osei',      classid: CLASS_JHS1A, level: 'jhs' },
    // JHS 2A
    { id: 'd2fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Oscar Amankwah',  classid: CLASS_JHS2A, level: 'jhs' },
    { id: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Patricia Appiah', classid: CLASS_JHS2A, level: 'jhs' },
    { id: 'd4fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Quentin Frimpong', classid: CLASS_JHS2A, level: 'jhs' },
    { id: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Rachel Amponsah', classid: CLASS_JHS2A, level: 'jhs' },
    // JHS 3A
    { id: 'd6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Samuel Agyei',    classid: CLASS_JHS3A, level: 'jhs' },
    { id: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Theresa Bediako', classid: CLASS_JHS3A, level: 'jhs' },
    { id: 'd8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Uriah Quaye',     classid: CLASS_JHS3A, level: 'jhs' },
    { id: 'd9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Vivian Tetteh',   classid: CLASS_JHS3A, level: 'jhs' },
    // Grade 9-C (JHS level)
    { id: '77d04ebb-8332-f111-88b4-7ced8d706811', name: 'Mikel Shawn',     classid: CLASS_GRADE9C, level: 'jhs' },
    // Grade 10-A (SHS level)
    { id: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', name: 'Karen Appiah',    classid: CLASS_GRADE10A, level: 'shs' },
    { id: '74f6928c-e034-f111-88b4-7ced8d3bbf70', name: 'Emilia Lawson',   classid: CLASS_GRADE10A, level: 'shs' },
    // Grade 11-B (SHS level)
    { id: '57893d40-d634-f111-88b4-7ced8d3bbf70', name: 'James Bond',      classid: CLASS_GRADE11B, level: 'shs' },
];

interface SubjectDef { id: string; teacherid: string; shortname: string }

const SUBJECTS_BY_LEVEL: Record<Level, SubjectDef[]> = {
    primary: [
        { id: SUBJ_ENG_PRIMARY, teacherid: TEACHER_ENG_PRIMARY, shortname: 'English' },
        { id: SUBJ_MTH_PRIMARY, teacherid: TEACHER_MTH_PRIMARY, shortname: 'Mathematics' },
    ],
    jhs: [
        { id: SUBJ_ENG_JHS, teacherid: TEACHER_ENG_JHS, shortname: 'English' },
        { id: SUBJ_MTH_JHS, teacherid: TEACHER_MTH_JHS, shortname: 'Mathematics' },
    ],
    shs: [
        { id: SUBJ_PHYSICS, teacherid: TEACHER_PHYSICS, shortname: 'Physics' },
    ],
};

interface AssessmentDef { type: number; label: string; termid: string; termname: string; date: string }

const ASSESSMENTS: AssessmentDef[] = [
    { type: 3, label: 'Quiz',         termid: TERM1, termname: 'Term 1', date: '2025-10-15' },
    { type: 5, label: 'End of Term',  termid: TERM1, termname: 'Term 1', date: '2025-12-12' },
    { type: 3, label: 'Quiz',         termid: TERM2, termname: 'Term 2', date: '2026-02-16' },
    { type: 5, label: 'End of Term',  termid: TERM2, termname: 'Term 2', date: '2026-03-27' },
    { type: 1, label: 'Classwork',    termid: TERM3, termname: 'Term 3', date: '2026-05-18' },
];

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

function studentBase(studentId: string): number {
    return 55 + (hashStr(studentId) % 36); // 55-90
}

function scoreFor(studentId: string, subjectId: string, assessIdx: number): number {
    const seed = hashStr(`${studentId}|${subjectId}|${assessIdx}`);
    const variation = Math.sin(seed) * 10; // -10..10
    let score = studentBase(studentId) + variation;
    score = Math.max(35, Math.min(99, score));
    return Math.round(score * 10) / 10;
}

function remarkFromPercent(pct: number): string {
    if (pct >= 90) return 'A+ - Excellent performance, keep it up!';
    if (pct >= 80) return 'A - Very good work.';
    if (pct >= 75) return 'B+ - Good performance.';
    if (pct >= 70) return 'B - Good, with room to improve.';
    if (pct >= 65) return 'C+ - Credit pass, more effort needed.';
    if (pct >= 60) return 'C - Satisfactory, needs more practice.';
    if (pct >= 50) return 'D - Pass, requires significant improvement.';
    return 'F - Needs urgent intervention and extra support.';
}

interface GradeJob {
    name: string;
    assessmenttype: number;
    score: number;
    maxscore: number;
    date: string;
    remarks: string;
    studentid: string;
    subjectid: string;
    classid: string;
    termid: string;
    teacherid: string;
}

function buildJobs(): GradeJob[] {
    const jobs: GradeJob[] = [];
    for (const student of STUDENTS) {
        const subjects = SUBJECTS_BY_LEVEL[student.level];
        subjects.forEach((subject, sIdx) => {
            ASSESSMENTS.forEach((assess, aIdx) => {
                const score = scoreFor(student.id, subject.id, sIdx * 10 + aIdx);
                jobs.push({
                    name: `${student.name} - ${subject.shortname} ${assess.label} (${assess.termname})`,
                    assessmenttype: assess.type,
                    score,
                    maxscore: 100,
                    date: assess.date,
                    remarks: remarkFromPercent(score),
                    studentid: student.id,
                    subjectid: subject.id,
                    classid: student.classid,
                    termid: assess.termid,
                    teacherid: subject.teacherid,
                });
            });
        });
    }
    return jobs;
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

async function runBatched<T>(items: T[], concurrency: number, fn: (item: T, idx: number) => Promise<void>): Promise<{ ok: number; failed: number }> {
    let ok = 0, failed = 0;
    let idx = 0;
    async function worker() {
        while (idx < items.length) {
            const i = idx++;
            try {
                await fn(items[i], i);
                ok++;
            } catch (e: any) {
                failed++;
                console.error(`   ✗ [${i}] ${JSON.stringify(e.response?.data ?? e.message)?.slice(0, 200)}`);
            }
        }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return { ok, failed };
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    const token = await getToken();
    const client = makeClient(token);

    const jobs = buildJobs();
    console.log(`\nSeeding ${jobs.length} sms_grades records for ${STUDENTS.length} students...\n`);

    const result = await runBatched(jobs, 8, async (job) => {
        await client.post('sms_grades', {
            sms_name: job.name,
            sms_assessmenttype: job.assessmenttype,
            sms_score: job.score,
            sms_maxscore: job.maxscore,
            sms_date: job.date,
            sms_remarks: job.remarks,
            'sms_student@odata.bind': `/sms_students(${job.studentid})`,
            'sms_subject@odata.bind': `/sms_subjects(${job.subjectid})`,
            'sms_class@odata.bind': `/sms_classes(${job.classid})`,
            'sms_term@odata.bind': `/sms_terms(${job.termid})`,
            'sms_academicyear@odata.bind': `/sms_academicyears(${ACADEMIC_YEAR_2025_2026})`,
            'sms_teacher@odata.bind': `/sms_teachers(${job.teacherid})`,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        });
    });

    console.log(`\nDone: ${result.ok} ok / ${result.failed} failed\n`);
}

main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
