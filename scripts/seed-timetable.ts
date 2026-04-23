/**
 * seed-timetable.ts — seeds a full Mon–Fri school timetable for Grade 10-A.
 * Run: npx ts-node --skip-project scripts/seed-timetable.ts
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
    return (await axios.post(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Timetable Full Week Seed');
    console.log('══════════════════════════════════════════\n');

    const token = await getToken();
    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // Fetch classes
    const classes: any[] = (await axios.get(`${API}/sms_classes?$select=sms_classid,sms_name&$top=4`, { headers: h, timeout: 20000 })).data.value ?? [];
    console.log('Classes:', classes.map(c => `${c.sms_name} (${c.sms_classid.slice(0,8)})`).join(', '));

    // Fetch subjects
    const subjects: any[] = (await axios.get(`${API}/sms_subjects?$select=sms_subjectid,sms_name&$top=10`, { headers: h, timeout: 20000 })).data.value ?? [];
    console.log('Subjects:', subjects.map(s => s.sms_name).join(', '));

    // Fetch teachers
    const teachers: any[] = (await axios.get(`${API}/sms_teachers?$select=sms_teacherid,sms_firstname,sms_lastname&$top=5`, { headers: h, timeout: 20000 })).data.value ?? [];
    console.log('Teachers:', teachers.map(t => `${t.sms_firstname} ${t.sms_lastname}`).join(', '), '\n');

    if (!classes.length || !subjects.length) {
        console.error('Need at least 1 class and 1 subject to seed.');
        return;
    }

    // Check how many entries already exist
    const existing = (await axios.get(`${API}/sms_timetables?$select=sms_timetableid,sms_dayofweek&$count=true`, { headers: h, timeout: 20000 })).data;
    const existingCount: number = existing['@odata.count'] ?? existing.value?.length ?? 0;
    const existingDays = new Set((existing.value ?? []).map((r: any) => r.sms_dayofweek));
    console.log(`Existing entries: ${existingCount} (days: ${[...existingDays].map(d => ['','Mon','Tue','Wed','Thu','Fri'][d as number] ?? d).join(', ')})\n`);

    const dayNames: Record<number, string> = { 1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday' };

    // School periods
    const periods = [
        { num: 1, start: '07:30', end: '08:30' },
        { num: 2, start: '08:30', end: '09:30' },
        { num: 3, start: '09:45', end: '10:45' },  // 15-min break
        { num: 4, start: '10:45', end: '11:45' },
        { num: 5, start: '13:00', end: '14:00' },  // lunch
        { num: 6, start: '14:00', end: '15:00' },
    ];

    // Subject schedule per day (by period index → subject index)
    const weekSchedule: Record<number, number[]> = {
        1: [0, 1, 2, 0, 1, 2],   // Mon: Math, English, Physics, Math, English, Physics
        2: [0, 1, 2, 0, 1, 2],   // Tue: same (already seeded)
        3: [1, 0, 1, 2, 0, 2],   // Wed
        4: [2, 1, 0, 1, 2, 0],   // Thu
        5: [0, 2, 1, 2, 0, 1],   // Fri
    };

    const rooms = ['101', '102', '103', '201', '202', '203'];
    const classRecord = classes[0];
    let seeded = 0;

    for (const day of [1, 2, 3, 4, 5]) {
        if (existingDays.has(day)) {
            console.log(`⏭  Day ${day} (${dayNames[day]}) — already seeded, skipping`);
            continue;
        }
        console.log(`📅  Seeding ${dayNames[day]}…`);
        const schedule = weekSchedule[day];
        for (let pi = 0; pi < periods.length; pi++) {
            const p = periods[pi];
            const subIdx = schedule[pi] % subjects.length;
            const subject = subjects[subIdx];
            const teacher = teachers.length > 0 ? teachers[subIdx % teachers.length] : null;
            const room = rooms[pi % rooms.length];

            const payload: Record<string, unknown> = {
                sms_dayofweek:  day,
                sms_starttime:  `1970-01-01T${p.start}:00Z`,
                sms_endtime:    `1970-01-01T${p.end}:00Z`,
                sms_roomnumber: room,
                sms_periodnumber: p.num,
                sms_name: `${dayNames[day]} P${p.num} - ${subject.sms_name}`,
                'sms_class@odata.bind':   `/sms_classes(${classRecord.sms_classid})`,
                'sms_subject@odata.bind': `/sms_subjects(${subject.sms_subjectid})`,
            };
            if (teacher) payload['sms_teacher@odata.bind'] = `/sms_teachers(${teacher.sms_teacherid})`;

            try {
                await axios.post(`${API}/sms_timetables`, payload,
                    { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 });
                console.log(`  ✓ P${p.num} ${p.start}–${p.end}  ${subject.sms_name}  Room ${room}${teacher ? '  ' + teacher.sms_firstname : ''}`);
                seeded++;
            } catch (err: any) {
                console.error(`  ✗ P${p.num}: ${err.response?.data?.error?.message ?? err.message}`);
            }
        }
    }

    // Final count
    const finalRes = await axios.get(`${API}/sms_timetables?$select=sms_timetableid&$count=true`, { headers: h, timeout: 20000 });
    const finalCount = finalRes.data['@odata.count'] ?? finalRes.data.value?.length ?? 0;
    console.log(`\n✅ Done. Seeded ${seeded} new entries. Total in table: ${finalCount}\n`);
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
