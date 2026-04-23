/**
 * test-timetable.ts — discovers sms_timetables fields, seeds real-world data, validates SELECT.
 * Run: npx ts-node --skip-project scripts/test-timetable.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;
const API_BASE      = `${DATAVERSE_URL}/api/data/v9.2`;
const TABLE         = 'sms_timetables';

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
            scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );
    return res.data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Timetable API Test');
    console.log('══════════════════════════════════════════\n');

    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // ── 1. Raw field discovery ────────────────────────────────────────────────
    console.log('① Raw record (no $select) — field discovery…');
    try {
        const res = await axios.get(`${API_BASE}/${TABLE}?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) {
            console.log('  ⚠ Table is empty — will seed data\n');
        } else {
            Object.keys(rows[0]).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            console.log();
        }
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message));
        return;
    }

    // ── 2. Fetch related records for seeding ─────────────────────────────────
    console.log('② Fetching existing classes and subjects for seed data…');
    let classes: any[] = [];
    let subjects: any[] = [];

    try {
        const cr = await axios.get(`${API_BASE}/sms_classes?$select=sms_classid,sms_name&$top=5`, { headers: h, timeout: 20000 });
        classes = cr.data.value ?? [];
        console.log(`  ✓ Classes: ${classes.map((c: any) => c.sms_name).join(', ')}`);

        const sr = await axios.get(`${API_BASE}/sms_subjects?$select=sms_subjectid,sms_name&$top=6`, { headers: h, timeout: 20000 });
        subjects = sr.data.value ?? [];
        console.log(`  ✓ Subjects: ${subjects.map((s: any) => s.sms_name).join(', ')}\n`);
    } catch (err: any) {
        console.error('  ✗ Could not fetch classes/subjects:', err.response?.data?.error?.message ?? err.message);
    }

    // ── 3. Try app SELECT with assumed fields ─────────────────────────────────
    console.log('③ Testing current app SELECT…');
    const appSelect = 'sms_timetableid,sms_name,sms_dayofweek,sms_starttime,sms_endtime,sms_roomnumber,_sms_classsubject_value,createdon,modifiedon';
    try {
        const res = await axios.get(`${API_BASE}/${TABLE}?$select=${appSelect}&$top=3`, { headers: h, timeout: 20000 });
        console.log(`  ✓ SELECT OK — ${res.data.value?.length ?? 0} record(s)\n`);
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', err.response?.data?.error?.message ?? err.message, '\n');
    }

    // ── 4. Seed real-world timetable data ─────────────────────────────────────
    console.log('④ Seeding real-world timetable entries…');

    // School schedule: Mon-Fri, 6 periods per day
    const periods = [
        { starttime: '07:30', endtime: '08:30' },
        { starttime: '08:30', endtime: '09:30' },
        { starttime: '09:45', endtime: '10:45' },
        { starttime: '10:45', endtime: '11:45' },
        { starttime: '13:00', endtime: '14:00' },
        { starttime: '14:00', endtime: '15:00' },
    ];

    const days = [1, 2, 3, 4, 5]; // Mon-Fri
    const dayNames: Record<number, string> = { 1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday' };
    const rooms = ['101', '102', '103', '201', '202', '203'];

    // Build subject rotation using real subjects (or fallback names)
    const subjectNames = subjects.length
        ? subjects.map((s: any) => s.sms_name)
        : ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'History'];

    let seeded = 0;
    const seedIds: string[] = [];

    // Seed 2 days × 4 periods = 8 representative entries
    const seedDays = days.slice(0, 2);
    const seedPeriods = periods.slice(0, 4);

    for (const day of seedDays) {
        for (let pi = 0; pi < seedPeriods.length; pi++) {
            const period = seedPeriods[pi];
            const subjectName = subjectNames[pi % subjectNames.length];
            const room = rooms[pi % rooms.length];

            const payload: Record<string, unknown> = {
                sms_dayofweek: day,
                sms_starttime: `1970-01-01T${period.starttime}:00Z`,
                sms_endtime:   `1970-01-01T${period.endtime}:00Z`,
                sms_roomnumber: room,
                sms_name: `${dayNames[day]} - ${subjectName} (${period.starttime})`,
            };

            // Bind class if available
            if (classes.length > 0) {
                payload['sms_class@odata.bind'] = `/sms_classes(${classes[0].sms_classid})`;
            }
            // Bind subject if available
            if (subjects.length > 0) {
                payload['sms_subject@odata.bind'] = `/sms_subjects(${subjects[pi % subjects.length].sms_subjectid})`;
            }

            try {
                const cr = await axios.post(`${API_BASE}/${TABLE}`, payload,
                    { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
                seedIds.push(cr.data.sms_timetableid);
                seeded++;
                process.stdout.write(`  ✓ ${dayNames[day]} ${period.starttime} — ${subjectName}\n`);
            } catch (err: any) {
                const msg = err.response?.data?.error?.message ?? err.message;
                console.error(`  ✗ ${dayNames[day]} ${period.starttime}: ${msg}`);
            }
        }
    }
    console.log(`\n  Seeded ${seeded} entries`);

    // ── 5. Read back and print ────────────────────────────────────────────────
    if (seeded > 0) {
        console.log('\n⑤ Reading back seeded entries…');
        try {
            const res = await axios.get(`${API_BASE}/${TABLE}?$top=20&$orderby=sms_dayofweek asc,sms_starttime asc`, { headers: h, timeout: 20000 });
            const rows: any[] = res.data.value ?? [];
            console.log(`  Total records in table: ${rows.length}`);
            rows.slice(0, 10).forEach((r, i) => {
                const day = r['sms_dayofweek@OData.Community.Display.V1.FormattedValue'] ?? r.sms_dayofweek;
                const start = r.sms_starttime ? String(r.sms_starttime).slice(11, 16) : '—';
                const end   = r.sms_endtime   ? String(r.sms_endtime).slice(11, 16) : '—';
                console.log(`  [${i+1}] ${day}  ${start}–${end}  room=${r.sms_roomnumber ?? '—'}  name="${r.sms_name ?? ''}"`);
            });
        } catch (err: any) {
            console.error('  ✗', err.response?.data?.error?.message ?? err.message);
        }
    }

    console.log('\n✅ Timetable API test complete.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
    process.exit(1);
});
