/**
 * seed-fee-types.ts — populate sms_feetype with real-world Ghanaian school fee categories.
 * Fields: sms_name, sms_description, sms_category (picklist), sms_mandatory (bool), sms_color
 * Category picklist: 1=Academic  2=Residential  3=Extracurricular  4=Administrative
 * Run: npm run seed:fee-types
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

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 },
    )).data.access_token;
}

interface Seed {
    name:        string;
    description: string;
    category:    1 | 2 | 3 | 4;   // 1=Academic 2=Residential 3=Extracurricular 4=Administrative
    mandatory:   boolean;
    color:       string;
}

const FEE_TYPES: Seed[] = [

    // ── Academic ────────────────────────────────────────────────────────────────
    {
        name:        'Tuition Fee',
        description: 'Core instructional fee covering teacher salaries, curriculum materials, and classroom resources.',
        category:    1,
        mandatory:   true,
        color:       'blue',
    },
    {
        name:        'Examination Fee',
        description: 'Internal end-of-term and end-of-year examination administration, marking, and processing.',
        category:    1,
        mandatory:   true,
        color:       'violet',
    },
    {
        name:        'BECE Registration Fee',
        description: 'WAEC Basic Education Certificate Examination registration for JHS 3 candidates.',
        category:    1,
        mandatory:   false,
        color:       'rose',
    },
    {
        name:        'WASSCE Registration Fee',
        description: 'WAEC West Africa Senior School Certificate Examination registration for SHS 3 candidates.',
        category:    1,
        mandatory:   false,
        color:       'red',
    },
    {
        name:        'Library Fee',
        description: 'Library resource acquisition, periodical subscriptions, and facility maintenance.',
        category:    1,
        mandatory:   true,
        color:       'cyan',
    },
    {
        name:        'ICT / Computer Lab Fee',
        description: 'Computer lab access, software licences, internet connectivity, and equipment upkeep.',
        category:    1,
        mandatory:   true,
        color:       'indigo',
    },
    {
        name:        'Science Lab Fee',
        description: 'Laboratory consumables, chemicals, and equipment maintenance for practical science classes.',
        category:    1,
        mandatory:   true,
        color:       'emerald',
    },
    {
        name:        'Textbook / Workbook Fee',
        description: 'Set of approved textbooks and exercise books supplied by the school for the academic year.',
        category:    1,
        mandatory:   true,
        color:       'blue',
    },
    {
        name:        'Mock Examination Fee',
        description: 'Pre-BECE and pre-WASSCE mock exam administration, scripts, and results processing.',
        category:    1,
        mandatory:   false,
        color:       'violet',
    },
    {
        name:        'Remedial / Extra Classes Fee',
        description: 'After-school or holiday remedial tuition and academic support programmes.',
        category:    1,
        mandatory:   false,
        color:       'amber',
    },

    // ── Residential ─────────────────────────────────────────────────────────────
    {
        name:        'Boarding Fee',
        description: 'Full-board accommodation covering dormitory provision, meals (breakfast, lunch, dinner), and house utilities.',
        category:    2,
        mandatory:   false,
        color:       'emerald',
    },
    {
        name:        'Feeding / Meals Fee',
        description: 'School canteen meal plan for day students opting into the school feeding programme.',
        category:    2,
        mandatory:   false,
        color:       'orange',
    },
    {
        name:        'Laundry Fee',
        description: 'Weekly laundry and ironing service for boarding students.',
        category:    2,
        mandatory:   false,
        color:       'cyan',
    },
    {
        name:        'Bedding / Linen Fee',
        description: 'Provision of mattress, bedsheet, pillow, and mosquito net for boarding students.',
        category:    2,
        mandatory:   false,
        color:       'slate',
    },
    {
        name:        'Generator / Electricity Levy',
        description: 'Contribution towards dormitory generator fuel and electrical maintenance costs.',
        category:    2,
        mandatory:   false,
        color:       'amber',
    },

    // ── Extracurricular ─────────────────────────────────────────────────────────
    {
        name:        'Sports & Games Fee',
        description: 'Physical education equipment, inter-school competitions, jerseys, and sports facility maintenance.',
        category:    3,
        mandatory:   true,
        color:       'orange',
    },
    {
        name:        'Cultural & Arts Fee',
        description: 'Costume, props, and participation costs for cultural events, drama festivals, and speech-and-prize days.',
        category:    3,
        mandatory:   true,
        color:       'rose',
    },
    {
        name:        'Debate & Quiz Fee',
        description: 'Registration, transport, and materials for inter-school debate and NSMQ competitions.',
        category:    3,
        mandatory:   false,
        color:       'indigo',
    },
    {
        name:        'School Band / Music Fee',
        description: 'Instrument maintenance, sheet music, and uniforms for the school band and choir.',
        category:    3,
        mandatory:   false,
        color:       'violet',
    },
    {
        name:        'Excursion / Field Trip Fee',
        description: 'Educational field trips, museum visits, and industrial excursions during the academic year.',
        category:    3,
        mandatory:   false,
        color:       'emerald',
    },
    {
        name:        'Clubs & Societies Fee',
        description: 'Activity fund for student clubs (Science, Mathematics, Literary, Cadet, Girl Guides, etc.).',
        category:    3,
        mandatory:   true,
        color:       'amber',
    },

    // ── Administrative ──────────────────────────────────────────────────────────
    {
        name:        'PTA Levy',
        description: 'Parent-Teacher Association dues funding school improvement projects and parent engagement activities.',
        category:    4,
        mandatory:   true,
        color:       'amber',
    },
    {
        name:        'Admission / Registration Fee',
        description: 'One-time processing fee for new student enrolment, covering application review and file creation.',
        category:    4,
        mandatory:   true,
        color:       'slate',
    },
    {
        name:        'Student ID Card Fee',
        description: 'Production and lamination of the school identity card. Replacement card charged separately.',
        category:    4,
        mandatory:   true,
        color:       'slate',
    },
    {
        name:        'School Uniform Fee',
        description: 'Approved school uniform set (including PE kit) procured through the school store.',
        category:    4,
        mandatory:   true,
        color:       'blue',
    },
    {
        name:        'Development / Building Fund',
        description: 'Capital levy supporting infrastructure projects — classrooms, sanitation, and rehabilitation.',
        category:    4,
        mandatory:   true,
        color:       'orange',
    },
    {
        name:        'Medical / Health Fund',
        description: 'School clinic, first-aid supplies, and basic health screening services for all students.',
        category:    4,
        mandatory:   true,
        color:       'rose',
    },
    {
        name:        'Report Card / Transcript Fee',
        description: 'Printing and issuance of end-of-term report cards and official academic transcripts.',
        category:    4,
        mandatory:   false,
        color:       'slate',
    },
    {
        name:        'School Bus / Transport Fee',
        description: 'Daily school bus service for students on registered transport routes.',
        category:    4,
        mandatory:   false,
        color:       'orange',
    },
    {
        name:        'Late Payment Surcharge',
        description: 'Administrative penalty applied on fees paid after the published due date.',
        category:    4,
        mandatory:   false,
        color:       'red',
    },
];

const CATEGORY_LABEL: Record<number, string> = {
    1: 'Academic', 2: 'Residential', 3: 'Extracurricular', 4: 'Administrative',
};

async function main() {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  Seed: sms_feetype');
    console.log('══════════════════════════════════════════════════════\n');

    if (!T || !C || !S || !D) { console.error('Missing env vars — check .env.local'); process.exit(1); }

    console.log('Acquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h  = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing names to skip duplicates
    const existRes = await axios.get(`${API}/sms_feetypes?$select=sms_name`, { headers: h, timeout: 20000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = new Set<string>((existRes.data.value ?? []).map((r: any) => (r.sms_name ?? '').toLowerCase()));
    console.log(`${existing.size} fee type(s) already exist in Dataverse\n`);

    // Group output by category
    let created = 0, skipped = 0;
    let currentCat = 0;

    for (const ft of FEE_TYPES) {
        if (ft.category !== currentCat) {
            currentCat = ft.category;
            console.log(`── ${CATEGORY_LABEL[currentCat]} ─────────────────────────────────`);
        }

        if (existing.has(ft.name.toLowerCase())) {
            console.log(`  ⏭  Skip  "${ft.name}"`);
            skipped++; continue;
        }

        const payload = {
            sms_name:        ft.name,
            sms_description: ft.description,
            sms_category:    ft.category,
            sms_mandatory:   ft.mandatory,
            sms_color:       ft.color,
        };

        try {
            const res = await axios.post(`${API}/sms_feetypes`, payload, { headers: ph, timeout: 20000 });
            const id  = res.data?.sms_feetypeid ?? '?';
            const mand = ft.mandatory ? '✓ mandatory' : '○ optional';
            console.log(`  ✓ "${ft.name}" [${mand}]`);
            console.log(`     ID: ${String(id).slice(0, 8)}…`);
            created++;
        } catch (err: any) {
            console.error(`  ✗ "${ft.name}": ${err.response?.data?.error?.message?.slice(0, 140) ?? err.message}`);
        }
    }

    console.log(`\n──────────────────────────────────────────────────────`);
    console.log(`  Done: ${created} created, ${skipped} skipped, ${FEE_TYPES.length - created - skipped} failed`);
    console.log('══════════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
