/**
 * seed-scholarships.ts — populate sms_scholarships with realistic school records.
 * Actual Dataverse fields verified via EntityDefinitions metadata:
 *   sms_name, sms_condition (memo), sms_type (picklist), sms_amount,
 *   sms_percentage, sms_startdate, sms_enddate, sms_sponsoredby,
 *   sms_student (lookup), sms_academicyear (lookup)
 * sms_type values: 922330000=Full, 922330001=Partial, 922330002=Bursary
 * Run: npx tsx scripts/seed-scholarships.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

// Known student IDs in Dataverse
const STUDENTS: Record<string, string> = {
    'Karen Appiah':  'fe4f35f5-843d-f111-bec6-70a8a59a431e',
    'James Bond':    '57893d40-d634-f111-88b4-7ced8d3bbf70',
    'Emilia Lawson': '74f6928c-e034-f111-88b4-7ced8d3bbf70',
    'Mikel Shawn':   '77d04ebb-8332-f111-88b4-7ced8d706811',
};

// Picklist values confirmed via EntityDefinitions
const TYPE = { FULL: 922330000, PARTIAL: 922330001, BURSARY: 922330002 };
const TYPE_LABEL: Record<number, string> = { [TYPE.FULL]: 'Full', [TYPE.PARTIAL]: 'Partial', [TYPE.BURSARY]: 'Bursary' };

interface Seed {
    name:        string;
    condition:   string;
    sponsoredby: string;
    type:        number;
    amount?:     number;
    percentage?: number;
    startdate:   string;
    enddate?:    string;
    student?:    keyof typeof STUDENTS;
    linkAY:      boolean;
}

const SCHOLARSHIPS: Seed[] = [
    {
        name:        'Presidential Merit Scholarship',
        condition:   'Awarded to the top-performing student in the school based on cumulative end-of-year results. Renewable annually subject to maintaining a minimum GPA of 3.8.',
        sponsoredby: 'Ministry of Education, Ghana',
        type: TYPE.FULL, amount: 2000,
        startdate: '2025-09-01', enddate: '2026-08-31',
        student: 'Karen Appiah', linkAY: true,
    },
    {
        name:        'Academic Excellence Award',
        condition:   'Recognises outstanding academic performance in core subjects. Student must achieve a minimum score of 90% in at least four core subjects.',
        sponsoredby: 'Old Students Alumni Association',
        type: TYPE.FULL, amount: 1500,
        startdate: '2025-09-01',
        student: 'Emilia Lawson', linkAY: true,
    },
    {
        name:        'Financial Assistance Bursary',
        condition:   'Means-tested support for students from low-income households. Recipients must submit annual proof of household income and maintain satisfactory academic progress.',
        sponsoredby: 'School Foundation Fund',
        type: TYPE.BURSARY, amount: 800,
        startdate: '2025-09-01', enddate: '2026-08-31',
        student: 'James Bond', linkAY: true,
    },
    {
        name:        'Partial Tuition Waiver',
        condition:   'Covers 50% of tuition fees for qualifying students demonstrating both financial need and academic merit. Approved by the Finance Committee each term.',
        sponsoredby: 'PTA Welfare Committee',
        type: TYPE.PARTIAL, percentage: 50,
        startdate: '2025-09-01',
        student: 'Mikel Shawn', linkAY: true,
    },
    {
        name:        'STEM Achievers Grant',
        condition:   'Granted to students excelling in Science, Technology, Engineering or Mathematics subjects. Covers science lab fees and approved textbooks in addition to partial tuition.',
        sponsoredby: 'TechGhana Foundation',
        type: TYPE.PARTIAL, amount: 1200,
        startdate: '2025-09-01',
        student: 'Karen Appiah', linkAY: true,
    },
    {
        name:        'Community Leaders Scholarship',
        condition:   'Awarded to students who demonstrate exceptional leadership, community service, and positive school citizenship. Assessed by a panel of teachers and prefects.',
        sponsoredby: 'District Community Development Fund',
        type: TYPE.PARTIAL, amount: 600,
        startdate: '2025-09-01',
        linkAY: true,
    },
    {
        name:        'Sports Excellence Award',
        condition:   'Supports student athletes who represent the school at district or national level. Recipient must remain in good academic standing with a minimum 60% average.',
        sponsoredby: 'Ghana School Sports Council',
        type: TYPE.PARTIAL, amount: 900,
        startdate: '2025-09-01',
        student: 'Emilia Lawson', linkAY: true,
    },
    {
        name:        'Orphan & Vulnerable Children Bursary',
        condition:   'Full fee waiver for students confirmed as orphans or from critically vulnerable households by the District Social Welfare Department. No academic threshold required.',
        sponsoredby: 'UNICEF Ghana — Education for All Programme',
        type: TYPE.BURSARY, amount: 700,
        startdate: '2025-09-01',
        student: 'James Bond', linkAY: true,
    },
    {
        name:        "Governor's Award for Excellence",
        condition:   'Prestigious full scholarship granted by the Regional Education Directorate for exemplary academic and social conduct. This award cycle has now closed.',
        sponsoredby: 'Regional Education Directorate',
        type: TYPE.FULL, amount: 2500,
        startdate: '2024-09-01', enddate: '2025-08-31',
        student: 'Emilia Lawson', linkAY: false,
    },
    {
        name:        'District Best Student Prize',
        condition:   'Awarded to the student achieving the highest aggregate score in the district-wide end-of-year written examination. One recipient per academic year.',
        sponsoredby: 'District Education Office',
        type: TYPE.PARTIAL, amount: 1000,
        startdate: '2025-09-01',
        student: 'Mikel Shawn', linkAY: true,
    },
];

async function main() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_scholarships');
    console.log('══════════════════════════════════════════════════\n');

    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('Acquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h  = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Latest academic year
    const ayRes = await axios.get(`${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$orderby=sms_name desc&$top=1`, { headers: h, timeout: 20000 });
    const ay = ayRes.data.value?.[0];
    console.log(`Academic year: ${ay?.sms_name ?? '(none)'}\n`);

    // Skip already-existing names
    const existRes = await axios.get(`${API}/sms_scholarships?$select=sms_name`, { headers: h, timeout: 20000 });
    const existing = new Set<string>((existRes.data.value ?? []).map((s: any) => (s.sms_name ?? '').toLowerCase()));
    console.log(`${existing.size} scholarship(s) already exist\n`);

    let created = 0, skipped = 0;

    for (const s of SCHOLARSHIPS) {
        if (existing.has(s.name.toLowerCase())) {
            console.log(`  ⏭  Skip  "${s.name}"`);
            skipped++; continue;
        }

        const payload: Record<string, unknown> = {
            sms_name:      s.name,
            sms_type:      s.type,
            sms_startdate: s.startdate,
        };
        if (s.condition)   payload.sms_condition   = s.condition;
        if (s.sponsoredby) payload.sms_sponsoredby = s.sponsoredby;
        if (s.amount)      payload.sms_amount      = s.amount;
        if (s.percentage)  payload.sms_percentage  = s.percentage;
        if (s.enddate)     payload.sms_enddate     = s.enddate;
        if (s.student)     payload['sms_student@odata.bind']      = `/sms_students(${STUDENTS[s.student]})`;
        if (s.linkAY && ay) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${ay.sms_academicyearid})`;

        try {
            const res = await axios.post(`${API}/sms_scholarships`, payload, { headers: ph, timeout: 20000 });
            const id  = res.data?.sms_scholarshipid ?? '?';
            const val = s.amount ? `GHS ${s.amount}` : s.percentage ? `${s.percentage}%` : '—';
            console.log(`  ✓ "${s.name}"`);
            console.log(`     ${TYPE_LABEL[s.type]} · ${val}${s.student ? ` · ${s.student}` : ''}`);
            console.log(`     Sponsor: ${s.sponsoredby}`);
            console.log(`     ID: ${String(id).slice(0, 8)}…`);
            created++;
        } catch (err: any) {
            console.error(`  ✗ "${s.name}": ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
        }
    }

    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`  Done: ${created} created, ${skipped} skipped`);
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
