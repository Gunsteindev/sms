/**
 * seed-grade-levels.ts — populate sms_gradelevels with Ghana Basic Education grade levels.
 * Verified Dataverse fields: sms_name, sms_ordernumber (Integer), sms_code, sms_description
 * Run: npx tsx scripts/seed-grade-levels.ts
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

interface Seed {
    name:        string;
    ordernumber: number;
    code:        string;
    description: string;
}

// Ghana Basic Education System: Primary 1–6 + Junior High School 1–3
const GRADE_LEVELS: Seed[] = [
    {
        name:        'Primary 1',
        ordernumber: 1,
        code:        'P1',
        description: 'Foundation literacy, numeracy, and social skills. Reading readiness and phonics.',
    },
    {
        name:        'Primary 2',
        ordernumber: 2,
        code:        'P2',
        description: 'Strengthens reading fluency, basic arithmetic, writing, and environmental studies.',
    },
    {
        name:        'Primary 3',
        ordernumber: 3,
        code:        'P3',
        description: 'Multiplication, division, creative arts, compositions, and RME introduced.',
    },
    {
        name:        'Primary 4',
        ordernumber: 4,
        code:        'P4',
        description: 'Upper primary core: English, Maths, Science, Social Studies, Ghanaian language.',
    },
    {
        name:        'Primary 5',
        ordernumber: 5,
        code:        'P5',
        description: 'Fractions, geometry, ICT literacy, and preparation for national assessment.',
    },
    {
        name:        'Primary 6',
        ordernumber: 6,
        code:        'P6',
        description: 'Completion of primary education. BECE prep. English and problem-solving focus.',
    },
    {
        name:        'JHS 1',
        ordernumber: 7,
        code:        'J1',
        description: 'JHS entry: Science, Maths, English, Social Studies, French, RME, Pre-Technical.',
    },
    {
        name:        'JHS 2',
        ordernumber: 8,
        code:        'J2',
        description: 'Deepened subject knowledge and BECE preparation. ICT and career guidance.',
    },
    {
        name:        'JHS 3',
        ordernumber: 9,
        code:        'J3',
        description: 'Final basic education year. BECE sitting determines SHS or TVET placement.',
    },
];

async function main() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_gradelevels');
    console.log('══════════════════════════════════════════════════\n');

    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('Acquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h  = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Skip already-existing names
    const existRes = await axios.get(`${API}/sms_gradelevels?$select=sms_name`, { headers: h, timeout: 20000 });
    const existing = new Set<string>((existRes.data.value ?? []).map((g: any) => (g.sms_name ?? '').toLowerCase()));
    console.log(`${existing.size} grade level(s) already exist\n`);

    let created = 0, skipped = 0;

    for (const g of GRADE_LEVELS) {
        if (existing.has(g.name.toLowerCase())) {
            console.log(`  ⏭  Skip  "${g.name}" (${g.code})`);
            skipped++; continue;
        }

        const payload = {
            sms_name:        g.name,
            sms_ordernumber: g.ordernumber,
            sms_code:        g.code,
            sms_description: g.description,
        };

        try {
            const res = await axios.post(`${API}/sms_gradelevels`, payload, { headers: ph, timeout: 20000 });
            const id  = res.data?.sms_gradelevelid ?? '?';
            console.log(`  ✓ "${g.name}" (${g.code}) — order ${g.ordernumber}`);
            console.log(`     ID: ${String(id).slice(0, 8)}…`);
            created++;
        } catch (err: any) {
            console.error(`  ✗ "${g.name}": ${err.response?.data?.error?.message?.slice(0, 120) ?? err.message}`);
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
