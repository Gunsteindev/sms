/**
 * seed-departments.ts — populate sms_departments with realistic school department records.
 * Fetches existing teachers and assigns them as HoDs where possible.
 * Skips departments whose name already exists.
 * Run: npx tsx scripts/seed-departments.ts
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

const DEPARTMENTS = [
    {
        name: 'Mathematics Department',
        description: 'Covers arithmetic, algebra, geometry, calculus, and statistics across all grade levels.',
    },
    {
        name: 'Science Department',
        description: 'Integrates physics, chemistry, and biology; runs the school laboratory and STEM projects.',
    },
    {
        name: 'English Language Department',
        description: 'Teaches English grammar, literature, comprehension, and communication skills.',
    },
    {
        name: 'Social Studies Department',
        description: 'Covers history, geography, civics, and cultural studies within a West African context.',
    },
    {
        name: 'Information & Communication Technology',
        description: 'Manages computer labs and teaches ICT, programming fundamentals, and digital literacy.',
    },
    {
        name: 'Languages Department',
        description: 'Delivers instruction in French, Twi, and other local languages as elective subjects.',
    },
    {
        name: 'Physical Education & Health',
        description: 'Oversees sports, fitness, health education, and inter-school athletic competitions.',
    },
    {
        name: 'Creative Arts Department',
        description: 'Encompasses visual arts, music, drama, and cultural performance programmes.',
    },
    {
        name: 'Technical & Vocational Skills',
        description: 'Provides hands-on training in woodwork, metalwork, home economics, and agricultural science.',
    },
    {
        name: 'Administration & Management',
        description: 'Handles school operations, records management, and staff co-ordination.',
    },
];

async function main() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_departments');
    console.log('══════════════════════════════════════════════════\n');

    if (!T || !C || !S || !D) {
        console.error('Missing required environment variables. Check .env.local');
        process.exit(1);
    }

    console.log('Acquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing teachers to assign as HoDs
    console.log('Fetching teachers…');
    const teacherRes = await axios.get(
        `${API}/sms_teachers?$select=sms_teacherid,sms_firstname,sms_lastname&$orderby=sms_firstname asc&$top=20`,
        { headers: h, timeout: 20000 }
    );
    const teachers: { id: string; name: string }[] = (teacherRes.data.value ?? []).map((t: any) => ({
        id: t.sms_teacherid,
        name: `${t.sms_firstname} ${t.sms_lastname}`,
    }));
    console.log(`  Found ${teachers.length} teacher(s): ${teachers.map(t => t.name).join(', ') || '(none)'}\n`);

    // Fetch existing department names to avoid duplicates
    console.log('Fetching existing departments…');
    const existingRes = await axios.get(
        `${API}/sms_departments?$select=sms_departmentid,sms_name`,
        { headers: h, timeout: 20000 }
    );
    const existingNames = new Set<string>(
        (existingRes.data.value ?? []).map((d: any) => (d.sms_name ?? '').toLowerCase())
    );
    console.log(`  ${existingNames.size} department(s) already in Dataverse\n`);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < DEPARTMENTS.length; i++) {
        const dept = DEPARTMENTS[i];

        if (existingNames.has(dept.name.toLowerCase())) {
            console.log(`  ⏭  Skip  "${dept.name}" (already exists)`);
            skipped++;
            continue;
        }

        const payload: Record<string, unknown> = {
            sms_name: dept.name,
            sms_description: dept.description,
        };

        // Assign an HoD cycling through available teachers
        if (teachers.length > 0) {
            const teacher = teachers[i % teachers.length];
            payload['sms_headofdepartment@odata.bind'] = `/sms_teachers(${teacher.id})`;
        }

        try {
            const res = await axios.post(`${API}/sms_departments`, payload, { headers: ph, timeout: 20000 });
            const id = res.data?.sms_departmentid ?? res.headers['odata-entityid'] ?? '?';
            const hodLabel = teachers.length > 0 ? ` — HoD: ${teachers[i % teachers.length].name}` : '';
            console.log(`  ✓ Created "${dept.name}" (${String(id).slice(0, 8)}…)${hodLabel}`);
            created++;
        } catch (err: any) {
            const msg = err.response?.data?.error?.message ?? err.message;
            console.error(`  ✗ Failed  "${dept.name}": ${msg}`);
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
