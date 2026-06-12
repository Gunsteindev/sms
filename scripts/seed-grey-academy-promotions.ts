/**
 * seed-grey-academy-promotions.ts
 *
 * Task #12 (part 2) — seed sms_promotions for the 36 Grey Academy students who
 * moved up a level to reach their current (2025-2026) class. The 3 Primary 1A
 * students are new admissions with no prior level, so they get no promotion
 * record. _sms_academicyear_value = 2025-2026 (the year being promoted INTO).
 *
 * Special cases for variety:
 *   - Kojo Nkrumah (Primary 2A): Retained — repeated Primary 2.
 *   - Patricia Appiah (JHS 2A): Transferred in from another school (no "from").
 *   - Karen Appiah & Emilia Lawson (Grade 10-A): Graduated JHS -> SHS 1.
 *   - Everyone else: Promoted to the next level.
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-promotions.ts
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

// ── Grade levels (order 1-11) ──
const GL_PRIMARY1 = 'c5a99665-5e3f-f111-bec6-70a8a59a431e';
const GL_PRIMARY2 = 'c7a99665-5e3f-f111-bec6-70a8a59a431e';
const GL_PRIMARY3 = 'abdeb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_PRIMARY4 = 'acdeb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_PRIMARY5 = 'aedeb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_PRIMARY6 = 'afdeb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_JHS1     = 'b0deb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_JHS2     = 'b1deb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_JHS3     = 'b2deb96b-5e3f-f111-bec6-70a8a59a431e';
const GL_SHS1     = '406e1e72-5666-f111-ab0c-0022480a56e3';
const GL_SHS2     = '426e1e72-5666-f111-ab0c-0022480a56e3';

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

type Status = 1 | 2 | 3 | 4; // Promoted, Retained, Transferred, Graduated

interface PromotionEntry {
    studentid: string;
    studentname: string;
    status: Status;
    fromgradelevelid: string | null;
    togradelevelid: string;
    fromclassid: string | null;
    toclassid: string;
    toclassname: string;
    remarks: string;
}

const PROMOTIONS: PromotionEntry[] = [
    // Primary 2A — from Primary 1A
    { studentid: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Yaw Adjei',       status: 1, fromgradelevelid: GL_PRIMARY1, togradelevelid: GL_PRIMARY2, fromclassid: CLASS_PRIMARY1A, toclassid: CLASS_PRIMARY2A, toclassname: 'Primary 2A', remarks: 'Promoted to Primary 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Akua Darko',      status: 1, fromgradelevelid: GL_PRIMARY1, togradelevelid: GL_PRIMARY2, fromclassid: CLASS_PRIMARY1A, toclassid: CLASS_PRIMARY2A, toclassname: 'Primary 2A', remarks: 'Promoted to Primary 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    // Kojo Nkrumah — Retained in Primary 2
    { studentid: '1032a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Kojo Nkrumah',    status: 2, fromgradelevelid: GL_PRIMARY2, togradelevelid: GL_PRIMARY2, fromclassid: CLASS_PRIMARY2A, toclassid: CLASS_PRIMARY2A, toclassname: 'Primary 2A', remarks: 'Did not meet the promotion criteria for Primary 3; retained in Primary 2A for the 2025-2026 academic year to consolidate foundational skills.' },
    { studentid: '1132a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Efua Osei',       status: 1, fromgradelevelid: GL_PRIMARY1, togradelevelid: GL_PRIMARY2, fromclassid: CLASS_PRIMARY1A, toclassid: CLASS_PRIMARY2A, toclassname: 'Primary 2A', remarks: 'Promoted to Primary 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Primary 3A — from Primary 2A
    { studentid: '1232a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Kwabena Amankwah', status: 1, fromgradelevelid: GL_PRIMARY2, togradelevelid: GL_PRIMARY3, fromclassid: CLASS_PRIMARY2A, toclassid: CLASS_PRIMARY3A, toclassname: 'Primary 3A', remarks: 'Promoted to Primary 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1332a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Adwoa Appiah',    status: 1, fromgradelevelid: GL_PRIMARY2, togradelevelid: GL_PRIMARY3, fromclassid: CLASS_PRIMARY2A, toclassid: CLASS_PRIMARY3A, toclassname: 'Primary 3A', remarks: 'Promoted to Primary 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1432a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Fiifi Frimpong',  status: 1, fromgradelevelid: GL_PRIMARY2, togradelevelid: GL_PRIMARY3, fromclassid: CLASS_PRIMARY2A, toclassid: CLASS_PRIMARY3A, toclassname: 'Primary 3A', remarks: 'Promoted to Primary 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1532a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Nana Amponsah',   status: 1, fromgradelevelid: GL_PRIMARY2, togradelevelid: GL_PRIMARY3, fromclassid: CLASS_PRIMARY2A, toclassid: CLASS_PRIMARY3A, toclassname: 'Primary 3A', remarks: 'Promoted to Primary 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Primary 4A — from Primary 3A
    { studentid: '1632a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Akosua Agyei',    status: 1, fromgradelevelid: GL_PRIMARY3, togradelevelid: GL_PRIMARY4, fromclassid: CLASS_PRIMARY3A, toclassid: CLASS_PRIMARY4A, toclassname: 'Primary 4A', remarks: 'Promoted to Primary 4A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1732a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Emmanuel Bediako', status: 1, fromgradelevelid: GL_PRIMARY3, togradelevelid: GL_PRIMARY4, fromclassid: CLASS_PRIMARY3A, toclassid: CLASS_PRIMARY4A, toclassname: 'Primary 4A', remarks: 'Promoted to Primary 4A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1832a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Gifty Quaye',     status: 1, fromgradelevelid: GL_PRIMARY3, togradelevelid: GL_PRIMARY4, fromclassid: CLASS_PRIMARY3A, toclassid: CLASS_PRIMARY4A, toclassname: 'Primary 4A', remarks: 'Promoted to Primary 4A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: '1932a6ae-c03f-f111-bec6-70a8a59a431e', studentname: 'Bright Tetteh',   status: 1, fromgradelevelid: GL_PRIMARY3, togradelevelid: GL_PRIMARY4, fromclassid: CLASS_PRIMARY3A, toclassid: CLASS_PRIMARY4A, toclassname: 'Primary 4A', remarks: 'Promoted to Primary 4A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Primary 5A — from Primary 4A
    { studentid: 'c6fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Bernice Asiedu',  status: 1, fromgradelevelid: GL_PRIMARY4, togradelevelid: GL_PRIMARY5, fromclassid: CLASS_PRIMARY4A, toclassid: CLASS_PRIMARY5A, toclassname: 'Primary 5A', remarks: 'Promoted to Primary 5A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Courage Acheampong', status: 1, fromgradelevelid: GL_PRIMARY4, togradelevelid: GL_PRIMARY5, fromclassid: CLASS_PRIMARY4A, toclassid: CLASS_PRIMARY5A, toclassname: 'Primary 5A', remarks: 'Promoted to Primary 5A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'c8fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Doris Kumi',      status: 1, fromgradelevelid: GL_PRIMARY4, togradelevelid: GL_PRIMARY5, fromclassid: CLASS_PRIMARY4A, toclassid: CLASS_PRIMARY5A, toclassname: 'Primary 5A', remarks: 'Promoted to Primary 5A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'c9fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Felix Adusei',    status: 1, fromgradelevelid: GL_PRIMARY4, togradelevelid: GL_PRIMARY5, fromclassid: CLASS_PRIMARY4A, toclassid: CLASS_PRIMARY5A, toclassname: 'Primary 5A', remarks: 'Promoted to Primary 5A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Primary 6A — from Primary 5A
    { studentid: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Gloria Asante',   status: 1, fromgradelevelid: GL_PRIMARY5, togradelevelid: GL_PRIMARY6, fromclassid: CLASS_PRIMARY5A, toclassid: CLASS_PRIMARY6A, toclassname: 'Primary 6A', remarks: 'Promoted to Primary 6A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'cbfca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Herman Mensah',   status: 1, fromgradelevelid: GL_PRIMARY5, togradelevelid: GL_PRIMARY6, fromclassid: CLASS_PRIMARY5A, toclassid: CLASS_PRIMARY6A, toclassname: 'Primary 6A', remarks: 'Promoted to Primary 6A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'ccfca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Irene Boateng',   status: 1, fromgradelevelid: GL_PRIMARY5, togradelevelid: GL_PRIMARY6, fromclassid: CLASS_PRIMARY5A, toclassid: CLASS_PRIMARY6A, toclassname: 'Primary 6A', remarks: 'Promoted to Primary 6A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'cdfca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'John Owusu',      status: 1, fromgradelevelid: GL_PRIMARY5, togradelevelid: GL_PRIMARY6, fromclassid: CLASS_PRIMARY5A, toclassid: CLASS_PRIMARY6A, toclassname: 'Primary 6A', remarks: 'Promoted to Primary 6A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // JHS 1A — from Primary 6A
    { studentid: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Kekeli Adjei',    status: 1, fromgradelevelid: GL_PRIMARY6, togradelevelid: GL_JHS1, fromclassid: CLASS_PRIMARY6A, toclassid: CLASS_JHS1A, toclassname: 'JHS 1A', remarks: 'Promoted to JHS 1A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Linda Darko',     status: 1, fromgradelevelid: GL_PRIMARY6, togradelevelid: GL_JHS1, fromclassid: CLASS_PRIMARY6A, toclassid: CLASS_JHS1A, toclassname: 'JHS 1A', remarks: 'Promoted to JHS 1A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd0fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Michael Nkrumah', status: 1, fromgradelevelid: GL_PRIMARY6, togradelevelid: GL_JHS1, fromclassid: CLASS_PRIMARY6A, toclassid: CLASS_JHS1A, toclassname: 'JHS 1A', remarks: 'Promoted to JHS 1A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd1fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Nancy Osei',      status: 1, fromgradelevelid: GL_PRIMARY6, togradelevelid: GL_JHS1, fromclassid: CLASS_PRIMARY6A, toclassid: CLASS_JHS1A, toclassname: 'JHS 1A', remarks: 'Promoted to JHS 1A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // JHS 2A — from JHS 1A
    { studentid: 'd2fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Oscar Amankwah',  status: 1, fromgradelevelid: GL_JHS1, togradelevelid: GL_JHS2, fromclassid: CLASS_JHS1A, toclassid: CLASS_JHS2A, toclassname: 'JHS 2A', remarks: 'Promoted to JHS 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    // Patricia Appiah — Transferred in, no prior class at Grey Academy
    { studentid: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Patricia Appiah', status: 3, fromgradelevelid: null, togradelevelid: GL_JHS2, fromclassid: null, toclassid: CLASS_JHS2A, toclassname: 'JHS 2A', remarks: 'Transferred in from another school and placed directly into JHS 2A for the 2025-2026 academic year.' },
    { studentid: 'd4fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Quentin Frimpong', status: 1, fromgradelevelid: GL_JHS1, togradelevelid: GL_JHS2, fromclassid: CLASS_JHS1A, toclassid: CLASS_JHS2A, toclassname: 'JHS 2A', remarks: 'Promoted to JHS 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Rachel Amponsah', status: 1, fromgradelevelid: GL_JHS1, togradelevelid: GL_JHS2, fromclassid: CLASS_JHS1A, toclassid: CLASS_JHS2A, toclassname: 'JHS 2A', remarks: 'Promoted to JHS 2A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // JHS 3A — from JHS 2A
    { studentid: 'd6fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Samuel Agyei',    status: 1, fromgradelevelid: GL_JHS2, togradelevelid: GL_JHS3, fromclassid: CLASS_JHS2A, toclassid: CLASS_JHS3A, toclassname: 'JHS 3A', remarks: 'Promoted to JHS 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Theresa Bediako', status: 1, fromgradelevelid: GL_JHS2, togradelevelid: GL_JHS3, fromclassid: CLASS_JHS2A, toclassid: CLASS_JHS3A, toclassname: 'JHS 3A', remarks: 'Promoted to JHS 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd8fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Uriah Quaye',     status: 1, fromgradelevelid: GL_JHS2, togradelevelid: GL_JHS3, fromclassid: CLASS_JHS2A, toclassid: CLASS_JHS3A, toclassname: 'JHS 3A', remarks: 'Promoted to JHS 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
    { studentid: 'd9fca0b4-c03f-f111-bec6-70a8a59a431e', studentname: 'Vivian Tetteh',   status: 1, fromgradelevelid: GL_JHS2, togradelevelid: GL_JHS3, fromclassid: CLASS_JHS2A, toclassid: CLASS_JHS3A, toclassname: 'JHS 3A', remarks: 'Promoted to JHS 3A for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Grade 9-C — from JHS 2A (shares JHS3 grade level with JHS 3A)
    { studentid: '77d04ebb-8332-f111-88b4-7ced8d706811', studentname: 'Mikel Shawn',     status: 1, fromgradelevelid: GL_JHS2, togradelevelid: GL_JHS3, fromclassid: CLASS_JHS2A, toclassid: CLASS_GRADE9C, toclassname: 'Grade 9-C', remarks: 'Promoted to Grade 9-C for the 2025-2026 academic year based on satisfactory end-of-year performance.' },

    // Grade 10-A — Graduated JHS 3A -> SHS 1
    { studentid: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', studentname: 'Karen Appiah',    status: 4, fromgradelevelid: GL_JHS3, togradelevelid: GL_SHS1, fromclassid: CLASS_JHS3A, toclassid: CLASS_GRADE10A, toclassname: 'Grade 10-A', remarks: 'Completed Junior High School and progressed to Senior High School (Grade 10-A) for the 2025-2026 academic year.' },
    { studentid: '74f6928c-e034-f111-88b4-7ced8d3bbf70', studentname: 'Emilia Lawson',   status: 4, fromgradelevelid: GL_JHS3, togradelevelid: GL_SHS1, fromclassid: CLASS_JHS3A, toclassid: CLASS_GRADE10A, toclassname: 'Grade 10-A', remarks: 'Completed Junior High School and progressed to Senior High School (Grade 10-A) for the 2025-2026 academic year.' },

    // Grade 11-B — from Grade 10-A
    { studentid: '57893d40-d634-f111-88b4-7ced8d3bbf70', studentname: 'James Bond',      status: 1, fromgradelevelid: GL_SHS1, togradelevelid: GL_SHS2, fromclassid: CLASS_GRADE10A, toclassid: CLASS_GRADE11B, toclassname: 'Grade 11-B', remarks: 'Promoted to Grade 11-B for the 2025-2026 academic year based on satisfactory end-of-year performance.' },
];

const STATUS_LABEL: Record<Status, string> = { 1: 'Promoted', 2: 'Retained', 3: 'Transferred', 4: 'Graduated' };

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

    console.log(`\nSeeding ${PROMOTIONS.length} sms_promotions records...\n`);

    const result = await runBatched(PROMOTIONS, 8, async (p) => {
        const payload: Record<string, unknown> = {
            sms_name: `${p.studentname} - ${STATUS_LABEL[p.status]} to ${p.toclassname} (2025-2026)`,
            sms_status: p.status,
            sms_promotiondate: '2025-08-15',
            sms_remarks: p.remarks,
            'sms_student@odata.bind': `/sms_students(${p.studentid})`,
            'sms_togradelevel@odata.bind': `/sms_gradelevels(${p.togradelevelid})`,
            'sms_toclass@odata.bind': `/sms_classes(${p.toclassid})`,
            'sms_academicyear@odata.bind': `/sms_academicyears(${ACADEMIC_YEAR_2025_2026})`,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        };
        if (p.fromgradelevelid) payload['sms_fromgradelevel@odata.bind'] = `/sms_gradelevels(${p.fromgradelevelid})`;
        if (p.fromclassid)      payload['sms_fromclass@odata.bind']      = `/sms_classes(${p.fromclassid})`;
        await client.post('sms_promotions', payload);
    });

    console.log(`\nDone: ${result.ok} ok / ${result.failed} failed\n`);
}

main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
