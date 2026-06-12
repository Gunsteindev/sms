/**
 * seed-grey-academy-medical.ts
 *
 * Task #13 (part 2) — seed sms_medical records for all 39 unique Grey Academy
 * students. Each record gets a deterministic-but-varied blood type, allergy
 * note, chronic condition (a couple with Sickle Cell Trait / Asthma — common
 * in Ghana), matching medication, Ghana EPI vaccination summary, a last
 * checkup date within the 2025-2026 school year, and an emergency contact
 * (parent name + Ghanaian phone number).
 *
 * Run: npx ts-node --skipProject scripts/seed-grey-academy-medical.ts
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

type Level = 'primary' | 'jhs' | 'shs';

interface StudentEntry { id: string; name: string; surname: string; level: Level }

const STUDENTS: StudentEntry[] = [
    { id: '0d32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Abena Owusu',      surname: 'Owusu',     level: 'primary' },
    { id: '0b32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Ama Mensah',       surname: 'Mensah',    level: 'primary' },
    { id: '0c32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwame Boateng',    surname: 'Boateng',   level: 'primary' },
    { id: '0e32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Yaw Adjei',        surname: 'Adjei',     level: 'primary' },
    { id: '0f32a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akua Darko',       surname: 'Darko',     level: 'primary' },
    { id: '1032a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kojo Nkrumah',     surname: 'Nkrumah',   level: 'primary' },
    { id: '1132a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Efua Osei',        surname: 'Osei',      level: 'primary' },
    { id: '1232a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Kwabena Amankwah', surname: 'Amankwah',  level: 'primary' },
    { id: '1332a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Adwoa Appiah',     surname: 'Appiah',    level: 'primary' },
    { id: '1432a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Fiifi Frimpong',   surname: 'Frimpong',  level: 'primary' },
    { id: '1532a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Nana Amponsah',    surname: 'Amponsah',  level: 'primary' },
    { id: '1632a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Akosua Agyei',     surname: 'Agyei',     level: 'primary' },
    { id: '1732a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Emmanuel Bediako', surname: 'Bediako',   level: 'primary' },
    { id: '1832a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Gifty Quaye',      surname: 'Quaye',     level: 'primary' },
    { id: '1932a6ae-c03f-f111-bec6-70a8a59a431e', name: 'Bright Tetteh',    surname: 'Tetteh',    level: 'primary' },
    { id: 'c6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Bernice Asiedu',   surname: 'Asiedu',    level: 'primary' },
    { id: 'c7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Courage Acheampong', surname: 'Acheampong', level: 'primary' },
    { id: 'c8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Doris Kumi',       surname: 'Kumi',      level: 'primary' },
    { id: 'c9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Felix Adusei',     surname: 'Adusei',    level: 'primary' },
    { id: 'cafca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Gloria Asante',    surname: 'Asante',    level: 'primary' },
    { id: 'cbfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Herman Mensah',    surname: 'Mensah',    level: 'primary' },
    { id: 'ccfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Irene Boateng',    surname: 'Boateng',   level: 'primary' },
    { id: 'cdfca0b4-c03f-f111-bec6-70a8a59a431e', name: 'John Owusu',       surname: 'Owusu',     level: 'primary' },
    { id: 'cefca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Kekeli Adjei',     surname: 'Adjei',     level: 'jhs' },
    { id: 'cffca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Linda Darko',      surname: 'Darko',     level: 'jhs' },
    { id: 'd0fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Michael Nkrumah',  surname: 'Nkrumah',   level: 'jhs' },
    { id: 'd1fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Nancy Osei',       surname: 'Osei',      level: 'jhs' },
    { id: 'd2fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Oscar Amankwah',   surname: 'Amankwah',  level: 'jhs' },
    { id: 'd3fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Patricia Appiah',  surname: 'Appiah',    level: 'jhs' },
    { id: 'd4fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Quentin Frimpong', surname: 'Frimpong',  level: 'jhs' },
    { id: 'd5fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Rachel Amponsah',  surname: 'Amponsah',  level: 'jhs' },
    { id: 'd6fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Samuel Agyei',     surname: 'Agyei',     level: 'jhs' },
    { id: 'd7fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Theresa Bediako',  surname: 'Bediako',   level: 'jhs' },
    { id: 'd8fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Uriah Quaye',      surname: 'Quaye',     level: 'jhs' },
    { id: 'd9fca0b4-c03f-f111-bec6-70a8a59a431e', name: 'Vivian Tetteh',    surname: 'Tetteh',    level: 'jhs' },
    { id: '77d04ebb-8332-f111-88b4-7ced8d706811', name: 'Mikel Shawn',      surname: 'Shawn',     level: 'jhs' },
    { id: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', name: 'Karen Appiah',     surname: 'Appiah',    level: 'shs' },
    { id: '74f6928c-e034-f111-88b4-7ced8d3bbf70', name: 'Emilia Lawson',    surname: 'Lawson',    level: 'shs' },
    { id: '57893d40-d634-f111-88b4-7ced8d3bbf70', name: 'James Bond',       surname: 'Bond',      level: 'shs' },
];

const BLOOD_TYPES = ['O+', 'O+', 'O+', 'A+', 'A+', 'B+', 'O-', 'AB+', 'A-', 'B-'];

interface HealthProfile { allergies: string; condition: string; medication: string }

const HEALTH_PROFILES: HealthProfile[] = [
    { allergies: 'None known', condition: 'None', medication: 'None' },
    { allergies: 'None known', condition: 'None', medication: 'None' },
    { allergies: 'None known', condition: 'None', medication: 'None' },
    { allergies: 'Penicillin allergy', condition: 'None', medication: 'None' },
    { allergies: 'Peanut allergy', condition: 'None', medication: 'None' },
    { allergies: 'Dust/pollen allergy (mild asthma trigger)', condition: 'Mild Asthma', medication: 'Salbutamol inhaler (as needed for wheezing episodes)' },
    { allergies: 'None known', condition: 'Sickle Cell Trait (AS)', medication: 'None — trait only, no medication required; stay hydrated and avoid extreme exertion' },
    { allergies: 'None known', condition: 'Eczema', medication: 'Hydrocortisone cream (as needed for flare-ups)' },
    { allergies: 'None known', condition: 'None', medication: 'None' },
    { allergies: 'None known', condition: 'None', medication: 'None' },
];

const PARENT_FIRST_NAMES = ['Kwame', 'Akua', 'Yaw', 'Abena', 'Kofi', 'Ama', 'Kojo', 'Adwoa', 'Kwabena', 'Akosua'];

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

const CHECKUP_DATES = [
    '2025-09-15', '2025-10-02', '2025-10-20', '2025-11-05', '2025-11-18',
    '2025-12-01', '2026-01-12', '2026-02-04', '2026-02-20', '2026-03-10',
    '2026-03-25', '2026-04-15', '2026-05-05', '2026-05-22', '2026-06-01',
];

function vaccinationRecordFor(level: Level): string {
    const base = 'Fully immunized per Ghana EPI schedule (BCG, OPV, Penta, PCV, Rotavirus, Measles-Rubella, Yellow Fever); Vitamin A supplementation up to date.';
    if (level === 'shs') return `${base} COVID-19 vaccinated (2 doses, 2022).`;
    return base;
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

    console.log(`\nSeeding ${STUDENTS.length} sms_medical records...\n`);

    const result = await runBatched(STUDENTS, 8, async (student, idx) => {
        const h = hashStr(student.id);
        const bloodtype = BLOOD_TYPES[h % BLOOD_TYPES.length];
        const profile = HEALTH_PROFILES[h % HEALTH_PROFILES.length];
        const parentFirst = PARENT_FIRST_NAMES[h % PARENT_FIRST_NAMES.length];
        const relation = h % 2 === 0 ? 'Mother' : 'Father';
        const phoneMid = String(20 + (h % 50)).padStart(2, '0');
        const phoneEnd = String(100000 + (h % 900000)).padStart(6, '0');
        const emergencyphone = `+233 ${phoneMid} ${phoneEnd.slice(0, 3)} ${phoneEnd.slice(3)}`;
        const checkupdate = CHECKUP_DATES[idx % CHECKUP_DATES.length];

        await client.post('sms_medical', {
            sms_name: `Medical Record - ${student.name}`,
            sms_bloodtype: bloodtype,
            sms_allergies: profile.allergies,
            sms_chronicconditions: profile.condition,
            sms_currentmedications: profile.medication,
            sms_vaccinationrecords: vaccinationRecordFor(student.level),
            sms_lastcheckupdate: checkupdate,
            sms_emergencycontact: `${parentFirst} ${student.surname} (${relation})`,
            sms_emergencyphone: emergencyphone,
            'sms_student@odata.bind': `/sms_students(${student.id})`,
            'sms_school@odata.bind': `/sms_schools(${GREY_ACADEMY_ID})`,
        });
    });

    console.log(`\nDone: ${result.ok} ok / ${result.failed} failed\n`);
}

main().catch((err: any) => {
    console.error('\nFatal:', JSON.stringify(err.response?.data ?? err.message)?.slice(0, 500));
    process.exit(1);
});
