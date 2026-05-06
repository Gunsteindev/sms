/**
 * seed-activities.ts — Populates sms_activities with realistic extracurricular records.
 * Covers Sports, Arts, Music, Drama, Science, Academic, and Cultural clubs for a Ghana basic school.
 * Safe to re-run (skips by activity name).
 * Run: npm run seed:activities
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

// Category picklist: 1=Sports  2=Arts  3=Music  4=Drama  5=Science  6=Academic  7=Cultural  8=Other
// Day picklist:      1=Mon  2=Tue  3=Wed  4=Thu  5=Fri  6=Sat  7=Sun
// Status picklist:   1=Active  2=Inactive

interface Activity {
    name: string;
    coordinator: string;
    venue: string;
    starttime: string;
    endtime: string;
    capacity: number;
    enrolled: number;
    category: number;
    day: number;
    status: number;
    description: string;
}

const ACTIVITIES: Activity[] = [
    // ── Sports ──────────────────────────────────────────────────────────────────
    {
        name:        'Boys Football Club',
        coordinator: 'Mr. Kwabena Asante',
        venue:       'School Football Pitch',
        starttime:   '14:30',
        endtime:     '16:30',
        capacity:    30,
        enrolled:    28,
        category:    1, // Sports
        day:         2, // Tuesday
        status:      1, // Active
        description: 'Competitive football training for boys in JHS 1–3. Participates in District inter-schools tournament.',
    },
    {
        name:        'Girls Volleyball Club',
        coordinator: 'Ms. Akosua Mensah',
        venue:       'School Court (Block B)',
        starttime:   '14:30',
        endtime:     '16:00',
        capacity:    20,
        enrolled:    18,
        category:    1, // Sports
        day:         4, // Thursday
        status:      1, // Active
        description: 'Volleyball training and match preparation. Competed in regional finals 2024.',
    },
    {
        name:        'Athletics & Track Club',
        coordinator: 'Mr. Samuel Tetteh',
        venue:       'School Grounds / Running Track',
        starttime:   '06:00',
        endtime:     '07:00',
        capacity:    40,
        enrolled:    35,
        category:    1, // Sports
        day:         1, // Monday
        status:      1, // Active
        description: 'Early-morning sprints, long jump, and cross-country training. Open to all classes.',
    },
    {
        name:        'Table Tennis Club',
        coordinator: 'Mr. Felix Darko',
        venue:       'ICT/Recreation Room',
        starttime:   '15:00',
        endtime:     '16:30',
        capacity:    16,
        enrolled:    14,
        category:    1, // Sports
        day:         5, // Friday
        status:      1, // Active
        description: 'Singles and doubles training. School entered district-level table tennis competition 2025.',
    },
    {
        name:        'Swimming Club',
        coordinator: 'Ms. Ama Boateng',
        venue:       'Municipal Swimming Pool (Adum)',
        starttime:   '15:30',
        endtime:     '17:00',
        capacity:    25,
        enrolled:    12,
        category:    1, // Sports
        day:         3, // Wednesday
        status:      2, // Inactive
        description: 'Suspended pending renewal of pool access agreement with Kumasi Metropolitan Assembly.',
    },

    // ── Arts ────────────────────────────────────────────────────────────────────
    {
        name:        'Visual Arts & Craft Club',
        coordinator: 'Ms. Abena Owusu',
        venue:       'Art Room (Block A)',
        starttime:   '14:00',
        endtime:     '16:00',
        capacity:    25,
        enrolled:    22,
        category:    2, // Arts
        day:         3, // Wednesday
        status:      1, // Active
        description: 'Drawing, painting, batik dyeing, and bead-making. Displays work at end-of-term exhibitions.',
    },
    {
        name:        'Photography & Media Club',
        coordinator: 'Mr. Nana Yaw Ofori',
        venue:       'Computer Lab',
        starttime:   '14:30',
        endtime:     '16:00',
        capacity:    20,
        enrolled:    15,
        category:    2, // Arts
        day:         5, // Friday
        status:      1, // Active
        description: 'Basic photography, editing on GIMP, and producing the school newsletter. School cameras provided.',
    },

    // ── Music ───────────────────────────────────────────────────────────────────
    {
        name:        'School Choir',
        coordinator: 'Mrs. Grace Amponsah',
        venue:       'Assembly Hall',
        starttime:   '14:00',
        endtime:     '15:30',
        capacity:    60,
        enrolled:    54,
        category:    3, // Music
        day:         2, // Tuesday
        status:      1, // Active
        description: 'Four-part harmony choir. Performs at assembly, speech day, and district GES events.',
    },
    {
        name:        'School Band',
        coordinator: 'Mr. Isaac Appiah',
        venue:       'Music Room (Block C)',
        starttime:   '15:00',
        endtime:     '16:30',
        capacity:    30,
        enrolled:    24,
        category:    3, // Music
        day:         4, // Thursday
        status:      1, // Active
        description: 'Brass, percussion, and keyboard ensemble. Provides music at school parades and speech day.',
    },

    // ── Drama ───────────────────────────────────────────────────────────────────
    {
        name:        'Drama & Theatre Club',
        coordinator: 'Mr. Kofi Boakye',
        venue:       'Assembly Hall Stage',
        starttime:   '14:30',
        endtime:     '16:30',
        capacity:    35,
        enrolled:    30,
        category:    4, // Drama
        day:         3, // Wednesday
        status:      1, // Active
        description: 'Script reading, stage craft, and full productions. End-of-term play performed for parents.',
    },
    {
        name:        'Public Speaking & Debate Club',
        coordinator: 'Mrs. Efua Asante',
        venue:       'JHS 3 Classroom',
        starttime:   '13:30',
        endtime:     '15:00',
        capacity:    24,
        enrolled:    20,
        category:    4, // Drama
        day:         1, // Monday
        status:      1, // Active
        description: 'Impromptu speeches, formal debates, and preparation for inter-school debate competitions.',
    },

    // ── Science ─────────────────────────────────────────────────────────────────
    {
        name:        'Science & Innovation Club',
        coordinator: 'Mr. Yaw Asante',
        venue:       'Science Laboratory',
        starttime:   '14:00',
        endtime:     '16:00',
        capacity:    30,
        enrolled:    27,
        category:    5, // Science
        day:         5, // Friday
        status:      1, // Active
        description: 'Hands-on experiments, science projects, and preparation for Ghana Science Olympiad.',
    },
    {
        name:        'Environmental & Garden Club',
        coordinator: 'Ms. Adwoa Frimpong',
        venue:       'School Garden & Grounds',
        starttime:   '07:00',
        endtime:     '08:00',
        capacity:    30,
        enrolled:    26,
        category:    5, // Science
        day:         6, // Saturday
        status:      1, // Active
        description: 'School garden tending, composting, tree planting, and environmental awareness campaigns.',
    },
    {
        name:        'Robotics & Coding Club',
        coordinator: 'Mr. Prince Amoah',
        venue:       'ICT Lab',
        starttime:   '14:00',
        endtime:     '16:00',
        capacity:    20,
        enrolled:    18,
        category:    5, // Science
        day:         2, // Tuesday
        status:      1, // Active
        description: 'Scratch programming, basic Arduino projects, and participation in Ghana STEMCraft competition.',
    },

    // ── Academic ────────────────────────────────────────────────────────────────
    {
        name:        'Mathematics Olympiad Club',
        coordinator: 'Mr. Kweku Asare',
        venue:       'JHS 2 Classroom',
        starttime:   '14:00',
        endtime:     '15:30',
        capacity:    25,
        enrolled:    22,
        category:    6, // Academic
        day:         3, // Wednesday
        status:      1, // Active
        description: 'Problem-solving drills, past BECE maths revision, and preparation for District Maths Competition.',
    },
    {
        name:        'Reading & Creative Writing Club',
        coordinator: 'Mrs. Esi Aidoo',
        venue:       'School Library',
        starttime:   '14:00',
        endtime:     '15:30',
        capacity:    30,
        enrolled:    21,
        category:    6, // Academic
        day:         4, // Thursday
        status:      1, // Active
        description: 'Guided reading, book reviews, creative writing challenges, and school magazine contributions.',
    },

    // ── Cultural ────────────────────────────────────────────────────────────────
    {
        name:        'Cultural Dance Troupe',
        coordinator: 'Ms. Akua Nimako',
        venue:       'Assembly Hall / Courtyard',
        starttime:   '14:30',
        endtime:     '16:30',
        capacity:    40,
        enrolled:    38,
        category:    7, // Cultural
        day:         5, // Friday
        status:      1, // Active
        description: 'Traditional Ghanaian dances — Kpanlogo, Adowa, and Agbadza. Performs at cultural events and Speech Day.',
    },
    {
        name:        'Home Economics & Cookery Club',
        coordinator: 'Mrs. Comfort Boateng',
        venue:       'Home Economics Room',
        starttime:   '14:00',
        endtime:     '16:00',
        capacity:    20,
        enrolled:    19,
        category:    7, // Cultural
        day:         1, // Monday
        status:      1, // Active
        description: 'Ghanaian cuisine, nutrition, and household management. Students prepare meals for charity events.',
    },
];

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_activities');
    console.log('══════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // Fetch existing records to skip duplicates (keyed by name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_activities?$select=sms_activityid,sms_name`,
        { headers: h, timeout: 30000 }
    );
    const existingNames = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => (r.sms_name ?? '').toLowerCase())
    );
    console.log(`  ${existingNames.size} existing activity(-ies) — skipping duplicates\n`);

    const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const CATS = ['', 'Sports', 'Arts', 'Music', 'Drama', 'Science', 'Academic', 'Cultural', 'Other'];

    let created = 0, skipped = 0;

    for (const a of ACTIVITIES) {
        if (existingNames.has(a.name.toLowerCase())) {
            console.log(`  [SKIP] ${a.name}`);
            skipped++; continue;
        }

        const payload: Record<string, unknown> = {
            sms_name:        a.name,
            sms_coordinator: a.coordinator,
            sms_venue:       a.venue,
            sms_starttime:   a.starttime,
            sms_endtime:     a.endtime,
            sms_capacity:    a.capacity,
            sms_enrolled:    a.enrolled,
            sms_category:    a.category,
            sms_day:         a.day,
            sms_status:      a.status,
            sms_description: a.description,
        };

        await axios.post(`${API}/sms_activities`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${CATS[a.category].padEnd(10)} ${DAYS[a.day]}  ${a.starttime}–${a.endtime}  ${a.name}`);
        created++;
    }

    const byCategory: Record<string, number> = {};
    for (const a of ACTIVITIES) {
        const cat = CATS[a.category];
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    console.log(`\n✓ Done: ${created} created, ${skipped} skipped`);
    console.log(`  Breakdown by category:`);
    for (const [cat, count] of Object.entries(byCategory)) {
        console.log(`    ${cat.padEnd(12)} ${count}`);
    }
    console.log(`  Total enrolled across all clubs: ${ACTIVITIES.reduce((s, a) => s + a.enrolled, 0)}\n`);
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
